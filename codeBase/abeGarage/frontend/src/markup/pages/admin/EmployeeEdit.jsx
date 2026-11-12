import React from "react";
import { useParams } from "react-router-dom"; // Import useParams to get the URL parameter
import EmployeeEditForm from "../../components/EmployeeEditForm/EmployeeEditForm";

function EmployeeEdit() {
	const { employee_id } = useParams(); // Get the employee_id from the URL

	return (
		<>
						{/* Pass employee_id as a prop to EmployeeEditForm */}
						<EmployeeEditForm employee_id={employee_id} />
      </>
	);
}

export default EmployeeEdit;
