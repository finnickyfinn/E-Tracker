const express = require('express');
const db = require('./config/connection');
const inquirer = require('inquirer');
const cTable = require('console.table');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const mainMenu = [
    {
        name: "mainPrompt",
        message: "What shall we do today?",
        type: "list",
        choices: [
            "View All Departments",
            "View All Roles",
            "View All Employees",
            "Add A Department",
            "Add A Role",
            "Add An Employee",
            "Update An Employee Role",
            "Update Employee Manager",
            "Delete Departments",
            "Delete Roles",
            "Delete Employees",
            "View Total Budget",
            "Quit"
        ],
        default: "View All Departments",
    },
];

const menu = () => {
    inquirer.prompt(mainMenu)
    .then(userInput => {
        let response = userInput.mainPrompt;
        switch(response) {
            case "View All Departments":
                viewDepartments();
                break;
            case "View All Roles":
                viewRoles();
                break;
            case "View All Employees":
                viewEmployees();
                break;
            case "Add A Department":
                addDepartment();
                break;
            case "Add A Role":
                addRole();
                break;
            case "Add An Employee":
                addEmployee();
                break;
            case "Update An Employee Role":
                updateEmpRole();    
                break;
            case "Update Employee Manager":
                updateEmpMngr();
                break;
            case "Delete Departments":
                deleteDepartment();
                break;
            case "Delete Roles":
                deleteRole();
                break;
            case "Delete Employees":
                deleteEmployee();
                break;
            case "View Total Budget":
                viewTotalBudget();
                break;
            case "Exit":
                console.log("See you!");
                db.end();
                break;
        }
    }); 
    
};
menu();



function viewDepartments() {
    db.query(`SELECT id, name FROM department ORDER BY name ASC;`, function (err, results) {
        if (err) throw (err);
        console.table(results);
        menu();  
    });
};

function viewRoles() {
    db.query(`SELECT role.id, role.title AS "job title", role.salary, department.name AS department FROM role JOIN department ON role.department_id = department.id ORDER BY department;`, function (err, results) {
        if (err) throw (err);
        console.table(results);
        menu();
    });
};


function viewEmployees() {
    db.query(`SELECT E.id, E.first_name AS "first name", E.last_name AS "last name", CONCAT(M.first_name, ' ', M.last_name) AS manager, R.title AS "job title", R.salary, D.name AS department FROM employee E LEFT JOIN employee M ON E.manager_id = M.id LEFT JOIN role R ON E.role_id = R.id LEFT JOIN department D ON R.department_id = D.id ORDER BY E.last_name;`, function (err, results) {
        if (err) throw (err);
        console.table(results);
        menu();
    });
};

function addDepartment() {
    inquirer.prompt([
        {
            name: "deptName",
            message: "Enter the name of the department you would like to add:",
            type: "input",
        }
    ])
    .then(answer => {
        db.query(`INSERT INTO department (name) VALUES ("${answer.deptName}")`, function (err) {
            if (err) throw (err);
            console.log("Successfully added " + answer.deptName + " department");
        })
        menu();
    });
};

function addRole() {
    const getDeptList = () => {
        db.query(`SELECT id AS value, name FROM department;`, function (err, results) {
            if (err) throw (err);
            inquirer.prompt([
                {
                    name: "roleTitle",
                    message: "Enter the title of the role you would like to add:",
                    type: "input",
                },
                {
                    name: "roleSalary",
                    message: "Enter the salary of the role you are adding (Example: 50000):",
                    type: "input",
                },
                {
                    name: "roleDeptID",
                    message: "Select the department that this role will be associated with:",
                    type: "list",
                    choices: results,
                }
            ])
            .then(answer => {
                db.query(`INSERT INTO role (title, salary, department_id) VALUES ("${answer.roleTitle}", ${answer.roleSalary}, ${answer.roleDeptID})`, function (err) {
                    if (err) throw (err);
                    console.log("Successfully added " + answer.roleTitle + " role")
                })
                menu();
            });
        });
    }
    getDeptList();
};

function addEmployee() {
    const getRoleList = () => {
        db.query(`SELECT id AS value, title AS name FROM role;`, function (err, results) {
            if (err) throw (err);
            inquirer.prompt([
                {
                    name: "firstName",
                    message: "Enter the employee's first name:",
                    type: "input",
                },
                {
                    name: "lastName",
                    message: "Enter the employee's last name:",
                    type: "input",
                },
                {
                    name: "roleID",
                    message: "Select the role that this employee will be associated with:",
                    type: "list",
                    choices: results,
                }
            ])
            .then(answer => {
                let answerBank = answer;
                const getMngrList = () => {
                    db.query(`SELECT id AS value, CONCAT(first_name, " ", last_name) AS name FROM employee;`, function (err, results) {
                        if (err) throw (err);
                        results.push({ value: 0, name: "null" });
                        inquirer.prompt([
                            {
                                name: "mngrID",
                                message: "Select the manager that this employee will work under:",
                                type: "list",
                                default: "null",
                                choices: results
                            }
                        ])
                        .then(answer => {
                            db.query(`INSERT INTO employee (first_name, Last_name, role_id, manager_id) VALUES ("${answerBank.firstName}", "${answerBank.lastName}", ${answerBank.roleID}, ${answer.mngrID})`, function (err) {
                                if (err) throw (err);
                                console.log("Successfully added " + answerBank.firstName + " " + answerBank.lastName + " as an employee");
                            });
                            menu();        
                        });
                    });
                };
                getMngrList();
            });
        });
    };
    getRoleList();
};

function updateEmpRole() {
    const getEmpList = () => {
        db.query(`SELECT id AS value, CONCAT(first_name, " ", last_name) AS name FROM employee;`, function (err, results) {
            if (err) throw (err);
            inquirer.prompt([
                {
                    name: "selectEmployee",
                    message: "Which employee's role are you updating?",
                    type: "list",
                    choices: results,
                },
            ])
            .then(answer => {
                let answerBank = answer;
                const getRoleList2 = () => {  
                    db.query(`SELECT id AS value, title AS name FROM role;`, function (err, results) {
                        if (err) throw (err);
                        inquirer.prompt([              
                            {
                                name: "updatedRole",
                                message: "What is this employees new role?",
                                type: "list",
                                choices: results,
                            }
                        ])
                        .then(answer => {
                            db.query(`UPDATE employee SET role_id = "${answer.updatedRole}" WHERE id = "${answerBank.selectEmployee}"`, function (err) {
                                if (err) throw (err);
                                console.log("Successfully updated role");
                            });
                            menu(); 
                        });
                    });
                };
                getRoleList2();
            });
        });
    };
    getEmpList();
};


function updateEmpMngr() {
    const getEmpList2 = () => {
        db.query(`SELECT id AS value, CONCAT(first_name, " ", last_name) AS name FROM employee;`, function (err, results) {
            if (err) throw (err);
            inquirer.prompt([
                {
                    name: "selectEmployee",
                    message: "Which employee's manager are you updating?",
                    type: "list",
                    choices: results,
                },
            ])
            .then(answer => {
                let answerBank = answer;
                const getMngrList2 = () => {
                    db.query(`SELECT id AS value, CONCAT(first_name, " ", last_name) AS name FROM employee;`, function (err, results) {
                        if (err) throw (err);
                        results.push({ value: 0, name: "null" });
                        inquirer.prompt([
                            {
                                name: "mngrID",
                                message: "Select the new manager that this employee will work under:",
                                type: "list",
                                default: "null",
                                choices: results
                            }
                        ])
                        .then(answer => {
                            db.query(`UPDATE employee SET manager_id = "${answer.mngrID}" WHERE id = "${answerBank.selectEmployee}"`, function (err) {
                                if (err) throw (err);
                                console.log("Successfully updated manager");
                            });
                            menu();        
                        });
                    });
                };
                getMngrList2();
            });
        });
    };
    getEmpList2();
};

function deleteDepartment() {
    const getDeptList2 = () => {
        db.query(`SELECT id AS value, name FROM department;`, function (err, results) {
            if (err) throw (err);
            inquirer.prompt([
                {
                    name: "deleteDept",
                    message: "Which department are you removing?",
                    type: "list",
                    choices: results,
                },
            ])
            .then(answer => {
                db.query(`DELETE FROM department WHERE id = "${answer.deleteDept}" `, function (err) {
                    if (err) throw (err);
                    console.log("Successfully removed department");
                });
                menu(); 
            });
        });
    };
    getDeptList2();
};

function deleteRole() {
    const getRoleList3 = () => {
        db.query(`SELECT id AS value, title AS name FROM role;`, function (err, results) {
            if (err) throw (err);
            inquirer.prompt([
                {
                    name: "deleteRole",
                    message: "Which role are you removing?",
                    type: "list",
                    choices: results,
                },
            ])
            .then(answer => {
                db.query(`DELETE FROM role WHERE id = "${answer.deleteRole}" `, function (err) {
                    if (err) throw (err);
                    console.log("Successfully removed role");
                });
                menu(); 
            });
        });
    };
    getRoleList3();
};

function deleteEmployee() {
    const getEmpList3 = () => {
        db.query(`SELECT id AS value, CONCAT(first_name, " ", last_name) AS name FROM employee;`, function (err, results) {
            if (err) throw (err);
            inquirer.prompt([
                {
                    name: "deleteEmp",
                    message: "Which employee are you removing?",
                    type: "list",
                    choices: results,
                },
            ])
            .then(answer => {
                db.query(`DELETE FROM employee WHERE id = "${answer.deleteEmp}" `, function (err) {
                    if (err) throw (err);
                    console.log("Successfully removed employee");
                });
                menu(); 
            });
        });
    };
    getEmpList3();
};

function viewTotalBudget() {
    db.query(`SELECT SUM(R.salary) AS "total budget" FROM employee E LEFT JOIN employee M ON E.manager_id = M.id LEFT JOIN role R ON E.role_id = R.id LEFT JOIN department D ON R.department_id = D.id;`, function (err, results) {
        if (err) throw (err);
        console.table(results);
        menu();
    });
};