import React from "react";
import SessionChart from "../src/components/Sesssion";
import NestedDropdown from "@/components/NestedDropdown";
import DepartmentCard from "@/components/DepartmentCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import {UserRole} from "@/contexts/AuthContext";

const Home = () => {
    const departmentsData = [
        {name: 'Ingénierie', count: 10},
        {name: 'IT', count: 20},
        {name: 'Marketing', count: 6},
        {name: 'Sécurité', count: 5}
    ];

    return (
        <>
            <ProtectedRoute>
                <div className=" flex md:flex-row flex-col gap-2 justify-between">
                    {/* <DepartmentsChart departments={departments} /> */}
                    <DepartmentCard departments={departmentsData}/>
                    <SessionChart/>
                </div>
                <div>
                    <DepartmentCard departments={departmentsData}/>
                </div>
                <div className="flex justify-center items-center min-h-screen bg-gray-100">
                    <div className="flex flex-row">
                        <div>Hello</div>
                        <div>Hi</div>
                    </div>
                    <NestedDropdown/>
                </div>
            </ProtectedRoute>
        </>
    );
};

export default Home;