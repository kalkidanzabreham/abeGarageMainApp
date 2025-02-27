import React from "react";
import { useParams } from "react-router-dom"; // Import useParams to get the URL parameter
import EmployeeEditForm from "../../components/EmployeeEditForm/EmployeeEditForm";
import AdminMenu from "../../components/Admin/AdminMenu/AdminMenu";

function EmployeeEdit() {
	const { employee_id } = useParams(); // Get the employee_id from the URL

	return (
		<div>
			<div className="container-fluid admin-pages">
				<div className="row">
					<div className="col-md-3 admin-left-side">
						<AdminMenu />
					</div>
					<div className="col-md-9 admin-right-side">
						{/* Pass employee_id as a prop to EmployeeEditForm */}
						<EmployeeEditForm employee_id={employee_id} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default EmployeeEdit;
