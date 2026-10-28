#!/usr/bin/env bash
# Phase 1 re-run of the Phase 0 audit probe (scripts/probe.sh).
# Same numbered checks, adapted to the fixed API: the schema comes from
# migrations + seed (GET /install and guest login no longer exist) and tokens
# come from real logins with the seeded demo accounts.
#
# Starts a throwaway MySQL container, migrates, seeds, starts the API and
# prints every request with its response. Usage: scripts/probe-phase1.sh
# Needs: docker, node, curl. Env overrides: DB_CONTAINER, DB_HOST_PORT, PORT.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/codeBase/abeGarage/backend"
CONTAINER=${DB_CONTAINER:-gh-probe-mysql}
DBPORT=${DB_HOST_PORT:-3308}
export PORT=${PORT:-5057} NODE_ENV=production CORS_ORIGINS=http://localhost:5173
export DB_HOST=127.0.0.1 DB_PORT=$DBPORT DB_USER=root DB_PASS=probe DB_NAME=garage
export JWT_SECRET=probe-secret-that-is-at-least-32-chars-long
export SEED_ALLOW_PRODUCTION=true DEMO_PASSWORD=GarageHub-demo-1
B=http://localhost:$PORT
LOG=$(mktemp)

SQL() { docker exec -i $CONTAINER mysql -uroot -pprobe garage -N -e "$1" 2>&1 | grep -v Warning; }
c() { echo; echo "\$ curl $*"; curl -s -m 5 -w '\n[HTTP %{http_code}]\n' "$@"; }
login() { curl -s -X POST $B/api/employee/login -H 'Content-Type: application/json' \
  -d "{\"employee_email\":\"$1@garagehub.test\",\"employee_password\":\"GarageHub-demo-1\"}" |
  node -e "let d='';process.stdin.on('data',x=>d+=x).on('end',()=>console.log(JSON.parse(d).token||''))"; }

docker rm -f $CONTAINER >/dev/null 2>&1
docker run -d --rm --name $CONTAINER -e MYSQL_ROOT_PASSWORD=probe -e MYSQL_DATABASE=garage -p $DBPORT:3306 mysql:8.0 >/dev/null
until docker exec $CONTAINER mysqladmin -uroot -pprobe ping >/dev/null 2>&1; do sleep 1; done; sleep 3
until docker exec $CONTAINER mysql -uroot -pprobe -e "SELECT 1" >/dev/null 2>&1; do sleep 1; done

cd "$BACKEND"
echo "### 1. Clean clone: migrations + seed (replaces public GET /install)"
npx knex migrate:latest && npx knex seed:run | tail -1
node app.js > "$LOG" 2>&1 & PID=$!; sleep 1.5
c $B/install
echo "### employees after seed:"; SQL "SELECT COUNT(*) FROM employee"

ADMIN=$(login admin); MANAGER=$(login manager); MECH=$(login mechanic); DEMO=$(login demo)

echo "### 2. Create employee with a valid admin JWT"
c -X POST $B/api/employee -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" \
  -d '{"employee_email":"a@a.com","employee_password":"pass12345","active_employee":1,"employee_first_name":"A","employee_last_name":"B","employee_phone":"1","company_role_id":3}'

echo "### 3. Add customer and add service with the admin JWT"
c -X POST $B/api/customers -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" \
  -d '{"customer_email":"c@c.com","customer_first_name":"Cu","customer_phone_number":"1"}'
c -X POST $B/api/services -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" \
  -d '{"service_name":"Oil","service_price":40}'

echo "### 4. Deactivated employee for check 6 (direct SQL, as in the original probe)"
SQL "UPDATE employee SET active_employee = 0 WHERE employee_email = 'a@a.com'"

echo "### 5. customer_hash was set by the API insert in step 3"
SQL "SELECT customer_email, LENGTH(customer_hash) AS hash_length FROM customer_identifier WHERE customer_email = 'c@c.com'"

echo "### 6. Login: unknown email vs wrong password (enumeration), deactivated employee"
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"nobody@x.com","employee_password":"x"}'
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"admin@garagehub.test","employee_password":"wrong"}'
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"a@a.com","employee_password":"pass12345"}'

echo "### 7. Unauthenticated reads/writes"
c $B/api/customers
c $B/api/employee
c -X POST $B/api/addvehicle/1 -H 'Content-Type: application/json' -d '{"vehicle_year":2010,"vehicle_make":"X","vehicle_model":"Y","vehicle_type":"Z","vehicle_mileage":1,"vehicle_tag":"T","vehicle_serial":"S","vehicle_color":"red"}'
c -X POST $B/api/guest-login

echo "### 8. Error detail leaked to client (order with missing fields)"
c -X POST $B/api/order -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" -d '{"customer_id":1}'

echo "### 9. Type-confusion: object instead of string (login)"
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":{"employee_email":1},"employee_password":"x"}'

echo "### 10. Pool leak: 15 requests that fail inside MySQL (FK violation), then a normal GET"
for i in $(seq 1 15); do curl -s -m 3 -o /dev/null -X POST $B/api/addvehicle/999999 -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" -d '{"vehicle_year":2010,"vehicle_make":"X","vehicle_model":"Y","vehicle_mileage":1}'; done
c -X POST $B/api/addvehicle/999999 -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" -d '{"vehicle_year":2010,"vehicle_make":"X","vehicle_model":"Y","vehicle_mileage":1}'
c $B/api/services -H "x-access-token: $ADMIN" -o /dev/null

echo "### 11. Login with email but no password"
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"admin@garagehub.test"}'
sleep 1; if kill -0 $PID 2>/dev/null; then echo "server still alive"; else echo "SERVER PROCESS EXITED"; fi

echo; echo "### Extra (Phase 1): role matrix spot checks"
for t in "DEMO POST /api/customers $DEMO" "MECHANIC POST /api/customers $MECH" "MANAGER POST /api/employee $MANAGER" "MANAGER POST /api/customers $MANAGER"; do
  set -- $t; printf "%-9s %-5s %-16s -> " $1 $2 $3
  curl -s -o /dev/null -w '%{http_code}\n' -X $2 $B$3 -H 'Content-Type: application/json' -H "x-access-token: $4" \
    -d "{\"customer_email\":\"x$RANDOM@example.com\",\"customer_first_name\":\"X\",\"employee_email\":\"m$RANDOM@x.com\",\"employee_password\":\"pass12345\",\"employee_first_name\":\"A\",\"employee_last_name\":\"B\",\"employee_phone\":\"1\",\"company_role_id\":1}"
done

echo; echo "### Extra (Phase 1): order total computed on the server (client sends 1.00)"
read CID VID <<< "$(SQL "SELECT customer_id, vehicle_id FROM customer_vehicle_info LIMIT 1")"
read S1 P1 <<< "$(SQL "SELECT service_id, service_price FROM common_services ORDER BY service_id LIMIT 1")"
read S2 P2 <<< "$(SQL "SELECT service_id, service_price FROM common_services ORDER BY service_id LIMIT 1 OFFSET 1")"
echo "catalog prices: $P1 + $P2"
c -X POST $B/api/order -H 'Content-Type: application/json' -H "x-access-token: $MANAGER" \
  -d "{\"customer_id\":$CID,\"vehicle_id\":$VID,\"order_total_price\":1,\"order_services\":[{\"service_id\":$S1},{\"service_id\":$S2}]}"

echo; echo "### Extra (Phase 1): login rate limit (10 failed attempts per IP / 15 min;"
echo "### the failed logins in checks 6, 9 and 11 above count toward the same limit)"
for i in $(seq 1 11); do printf "%s " "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"admin@garagehub.test","employee_password":"wrong-pass"}')"; done; echo

kill $PID 2>/dev/null
docker rm -f $CONTAINER >/dev/null
echo; echo "--- server log (errors only):"; grep -iE "error|exception" "$LOG" | head -5 || true
rm -f "$LOG"
