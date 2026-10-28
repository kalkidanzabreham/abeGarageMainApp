#!/usr/bin/env bash
# Phase 0 audit probe: runs the UNMODIFIED backend copy against a throwaway MySQL.
S=/tmp/claude-1000/-home-kal-Desktop-Enhance-abeGarage/7d7671a3-83fd-487d-97b5-d371d5ff7dd5/scratchpad
cd "$S/backend"
export PORT=5055 DB_HOST=127.0.0.1 DB_USER=root DB_PASS=audit DB_NAME=garage JWT_SECRET=audit-secret
# mysql2 pool in db.config.js has no port option -> use a socat-free trick: DB_HOST with default port 3306 won't work,
# so we patch nothing; instead we run a tiny port forward via node.
B=http://localhost:5055
SQL() { docker exec -i gh-audit-mysql mysql -uroot -paudit garage -N -e "$1" 2>&1 | grep -v Warning; }
c() { echo; echo "\$ curl $*"; curl -s -m 5 -w '\n[HTTP %{http_code}]\n' "$@"; }

until docker exec gh-audit-mysql mysqladmin -uroot -paudit ping >/dev/null 2>&1; do sleep 1; done; sleep 3
node app.js > $S/server.log 2>&1 &
PID=$!; sleep 1.5

ADMIN=$(node -e "console.log(require('jsonwebtoken').sign({employee_role_id:3,employee_id:1},'audit-secret',{expiresIn:'1h'}))")

echo "### 1. Clean clone: /install (public GET, no auth)"
c $B/install
echo "### roles seeded; any employee rows?"; SQL "SELECT COUNT(*) AS employees FROM employee"

echo "### 2. Create employee WITH a valid admin JWT (route has verifyAdmin but no verifyToken)"
c -X POST $B/api/employee -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" \
  -d '{"employee_email":"a@a.com","employee_password":"pass1234","active_employee":1,"employee_first_name":"A","employee_last_name":"B","employee_phone":"1","company_role_id":3}'

echo "### 3. Same for add customer and add service"
c -X POST $B/api/customers -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" -d '{"customer_email":"c@c.com"}'
c -X POST $B/api/services -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" -d '{"service_name":"Oil"}'

echo "### 4. Seed admin + customer + service directly in SQL to continue"
HASH=$(node -e "console.log(require('bcrypt').hashSync('pass1234',10))")
SQL "INSERT INTO employee (employee_email,active_employee) VALUES ('admin@x.com',1);
INSERT INTO employee_info (employee_id,employee_first_name,employee_last_name,employee_phone) VALUES (1,'Ad','Min','1');
INSERT INTO employee_pass (employee_id,employee_password_hashed) VALUES (1,'$HASH');
INSERT INTO employee_role (employee_id,company_role_id) VALUES (1,3);
INSERT INTO employee (employee_email,active_employee) VALUES ('fired@x.com',0);
INSERT INTO employee_info (employee_id,employee_first_name,employee_last_name,employee_phone) VALUES (2,'Ex','Emp','1');
INSERT INTO employee_pass (employee_id,employee_password_hashed) VALUES (2,'$HASH');
INSERT INTO employee_role (employee_id,company_role_id) VALUES (2,1);
INSERT INTO common_services (service_name) VALUES ('Oil change');"

echo "### 5. The exact INSERT customer.service.js uses (no customer_hash)"
SQL "INSERT INTO customer_identifier(customer_email,customer_phone_number) VALUES('c@c.com','1')"
SQL "INSERT INTO customer_identifier(customer_email,customer_phone_number,customer_hash) VALUES('c@c.com','1','h');
INSERT INTO customer_info(customer_id,customer_first_name,customer_last_name,active_customer_status) VALUES(1,'Cu','St',1);"

echo "### 6. Login: unknown email vs wrong password (enumeration), deactivated employee"
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"nobody@x.com","employee_password":"x"}'
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"admin@x.com","employee_password":"wrong"}'
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"fired@x.com","employee_password":"pass1234"}' | head -c 60; echo

echo "### 7. Unauthenticated reads/writes"
c $B/api/customers
c $B/api/employee | head -c 200; echo
c -X POST $B/api/addvehicle/1 -H 'Content-Type: application/json' -d '{"vehicle_year":2010,"vehicle_make":"X","vehicle_model":"Y","vehicle_type":"Z","vehicle_mileage":1,"vehicle_tag":"T","vehicle_serial":"S","vehicle_color":"red"}'
c -X POST $B/api/guest-login

echo "### 8. Error detail leaked to client (order with missing fields)"
c -X POST $B/api/order -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" -d '{"customer_id":1}'

echo "### 9. Type-confusion: object instead of string in a ? placeholder"
node -e "console.log(require('mysql2').format('SELECT * FROM employee WHERE employee_email = ?', [{employee_email: 1}]))"

echo "### 10. Pool leak: 10 failing queries (FK violation), then a normal GET"
for i in $(seq 1 10); do curl -s -m 3 -o /dev/null -X POST $B/api/order -H 'Content-Type: application/json' -H "x-access-token: $ADMIN" -d '{"employee_id":1,"customer_id":999,"vehicle_id":999,"order_services":[]}'; done
c $B/api/services

echo "### 11. Restart server; login with email but no password"
kill $PID; sleep 0.5; node app.js >> $S/server.log 2>&1 & PID=$!; sleep 1.5
c -X POST $B/api/employee/login -H 'Content-Type: application/json' -d '{"employee_email":"admin@x.com"}'
sleep 1; if kill -0 $PID 2>/dev/null; then echo "server still alive"; else echo "SERVER PROCESS EXITED"; fi
c $B/api/services
echo "--- server log tail:"; tail -12 $S/server.log
kill $PID 2>/dev/null
