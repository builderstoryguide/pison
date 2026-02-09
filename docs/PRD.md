# MICROFINANCE MANAGEMENT SYSTEM
## Product Requirements Document (PRD)

## I - Daily Collection Management System for a Microfinance Company

### Introduction to the Need as Initially Defined

The daily collection management software, as initially described, is intended to replace the current software and be hosted on a local server within the company, with the following functionalities:

#### 1. Processing:
- Input of daily collections
- Management of clients and agents
- Loan management
- Monthly balance
- Account status
- Collection journal
- Client statement
- Statistics by collection area
- Automatic monthly commission calculation by account
- Transaction validation system by the administrator (four-eye principle)
- Monitoring of surpluses and shortages

#### 2. Users:
- Administrator
- Accountant
- Agent

#### Supported Languages:
- French
- English

---

## Description of the Daily Collection Management System (DCMS)

The DCMS is a computerized system capable of managing the operations of a financial structure (microfinance), particularly the following:

### Input of Daily Collections
This involves entering into the system the amounts deposited by clients. For each collection area, one or more agents are responsible for collecting money from clients, entering the collected amounts into each client's account, and depositing the cash at the microfinance institution.

### Management of Clients, Agents, and Accountants
- **Clients**: Indirect users of the system who can request to open an account, consult it, or close it.
- **Agents**: Users with sufficient access rights to view the client list. Each agent can only see the client list in their assigned area, and an agent may be assigned to multiple collection areas in the city.
- **Accountant**: Can consult the transactions of the agents and perform deposit and withdrawal operations for clients visiting the office.

### Loan Management
A client can take out a loan and repay it later. This loan constitutes a negative amount in their account, which is updated when the loan is repaid. This functionality is exclusively controlled by the administrator account.

### Monthly Balance
The system generates monthly balance statements by client, by area, and overall. The monthly balance is managed through a mechanism for creating units, which the application uses to represent physical money. Thus, accounts can be credited and debited, and the structure is able to track and control the difference between the cash present and the units in the system.

### Account Status
This aspect concerns the transaction status of a client or any other user with an account.

### Collection Journal
The system presents, upon request, a report of collections made by an agent for a given day and/or by area.

### Statistics by Collection Area
Producing statistics regarding deposits and withdrawals conducted.

### Automatic Monthly Commission Calculation by Account
The money withdrawal operations performed by clients incur a commission amount deducted. This amount can be defined by the client and does not apply to certain clients.

### Transaction Validation System by the Administrator (Four-Eye Principle)
For all operations performed by the agents or the accountant's account, the administrator must validate them from their account. This ensures total control over transactions for the administrator and requires their constant presence. Generally, validations occur at the end of the day.

### Monitoring of Surpluses and Shortages

**Note**: Collection operations are simply deposit operations, except that the agent is responsible for going to the client to collect the money. The system starts in the morning when the server is turned on, and the accounting day closes only once. Once the session of the day is closed, no user can access their account.

---

## Actors

1. **Administrator**: Responsible for overall system management, including transaction validation and user control.
2. **Accountant**: Manages financial transactions, including deposits and withdrawals. Has access to transaction history.
3. **Collection Agent**: Responsible for collecting payments from clients, entering them into the system, and managing client relationships within designated areas.
4. **Client**: End-users of the system who can perform activities related to their accounts, such as deposits, withdrawals, and loan requests.

---

## Use Cases

### System Actors:
- Administrator
- Accountant
- Agents
- Client

### Use Cases for Each Actor:

#### Clients:
- Request to open an account.
- Consult account.
- Request a deposit, withdrawal, or loan.
- Request to close the account.

#### Agent (Collection Agent):
- Enter collected amounts into clients' accounts (Allocation/Ventilation).
- View the list of clients in their assigned area.

#### Accountant:
- Consult transactions made by agents for their clients.
- Perform deposit and withdrawal operations for clients coming to the office.
- Create Client account
- Create Agent account
- Performs Deposit and Withdrawal to Agent's accounts.

#### Administrator:
- Validate transactions performed by agents or the accountant at the end of the day.
- Validate Accounts created by Accountant
- Create Client account
- Create Agent account
- Create Accountant account
- Add, modify, or remove user accounts and permissions
- Create and view various operational reports, including financial summaries and transaction logs.
- Maintain total control over system transactions.

---

## Operation Sequences

### 1. Input of Daily Collections (Ventilation)

This operation is performed by the agent (Collector), after collecting money from various clients, he/she will perform the process of Ventilation. The process is described as:

1. The Collection Agent collects payments from clients.
2. The agent accesses the system via their user interface.
3. The agent selects the "Daily Collections" option.
4. The agent chooses the corresponding collection area.
5. The agent inputs the amount collected from each client. That is refill the account of the client.
6. The system validates the input (e.g., checks format and constraints).
7. The collected amounts are recorded in the system against each client's account.
8. A confirmation receipt can be printed for the agent and/or forwarded to the client.

### 2. Management of Client and Agents

This operation is performed by the accountant or/and the manager (Administrator). It allows to access the management module, selects either to manage client or agent, then:

**For Clients:**
- The administrator can view a list of all clients.
- The administrator can add a new client by entering required details (e.g., name, contact information).
- The administrator can edit existing client information.
- The administrator can deactivate or delete a client account.

**For Agents:**
- The administrator can view a list of all agents.
- The administrator can add a new agent by entering their details.
- The administrator can assign collection areas to agents.
- The administrator can modify agent details or deactivate their accounts.
- The administrator can refill the account of a collector.

### 3. Loan Management

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator). It allows to authorize a client to have a negative account balance.

1. A client requests a loan.
2. The accountant inputs the loan request and details (e.g., amount, purpose).
3. The system checks the client's eligibility based on criteria defined by the institution (e.g., credit score, existing loans).
4. If eligible, the loan request is approved by the administrator.
5. The system records the loan amount as a negative entry in the client's account.
6. When the client makes repayments, the system updates the loan balance accordingly.

### 4. Periodic Balance

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator). It allows to view the statistics for a given period or a given set of customers.

1. The Administrator requests a monthly balance report.
2. The system retrieves all transactions for the specified month.
3. The system calculates the total deposits, withdrawals, loans, and commissions.
4. The system summarizes the balance by client and collection area.
5. The report is generated and can be viewed or downloaded by the administrator.

### 5. Account Status

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator). It allows to view the account status for a given period or a given set of customers.

1. A client logs into their account.
2. The system retrieves the account status, including all transactions, remaining loan balance, and current balance.
3. The client can view this information in real-time on their dashboard.

### 6. Collection Journal

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator). It allows to view the report of the operations of an agent.

1. The Administrator requests the collection journal report.
2. The system retrieves all transaction entries for specified dates or collection areas.
3. The report is displayed with details like agent name, client name, amount collected, and date.
4. The data can be filtered by date, area, or agent.

### 7. Client Statement

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator).

1. A client requests their account statement.
2. The client accesses their account via the system.
3. The system compiles all transactions related to the client over a designated period.
4. The statement includes deposits, withdrawals, loans, and remaining balance.
5. The statement can be printed or saved in a digital format.

### 8. Statistics by Area of Collection

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator).

1. The Administrator selects the "Statistics" module.
2. The system allows filtering by specific collection areas.
3. The system retrieves and displays deposit and withdrawal statistics for each area.
4. The report can be exported for further analysis.

### 9. Automatic Calculation of Period Deduction of Commissions

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator).

1. At the end of the month, the system automatically calculates commissions based on specified rules.
2. The system retrieves all transactions (withdrawals) for each client.
3. The commission amount for each withdrawal is calculated.
4. The total commission is recorded in the respective accounts.
5. A summary report of commissions by client is generated.

### 10. Validation of Transactions by Administrator (Principle of Four Eyes)

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator).

1. When an agent or accountant performs a transaction, the system flags it for administrator review.
2. The administrator receives a notification of the pending transaction.
3. The administrator logs into the system and reviews the transaction details.
4. The administrator can approve or reject the transaction.
5. Upon approval, the transaction is finalized in the system; if rejected, a reason is recorded.

### 11. Monitoring of Shortages and Surpluses

This operation is performed by the accountant (provided access is granted by the manager) or/and the manager (Administrator).

1. The system continuously tracks physical cash versus recorded units in the digital system.
2. At the end of each day, the administrator runs a report to compare actual cash on hand with system records.
3. Any discrepancies (surpluses or shortages) are logged.
4. The system alerts the administrator to investigate any significant discrepancies.

---

## System Requirements

### Technical Requirements
- Hosted on a local server within the company
- Multi-language support (French and English)
- Daily session management (system starts in the morning, accounting day closes once per day)
- Once the session of the day is closed, no user can access their account

### Security Requirements
- Role-based access control (Administrator, Accountant, Agent, Client)
- Four-eye principle for transaction validation
- Audit trail for all transactions
- Secure authentication and authorization

### Functional Requirements
- Real-time account balance updates
- Transaction history tracking
- Report generation (PDF, Excel, CSV)
- Commission calculation automation
- Surplus/shortage monitoring
- Loan management with negative balance support

---

### Special Notations
1. The Client: This is one of the main elements of the Transaction Processing system (TPS) of the organization. The Client has an account in the system, he or she performs a set of operations on the account, such as: Deposit, withdrawal, Transfer and Saving.
Technically, the client has no direct access to his or her account. All operations are made via the intermediary of the Agent (Collector) or Accountant. There is no interface via which the client can access and consult the account statement, he or she can only request for this service from a an Agent or an Accountant. 

2. The Agent (Collector): This is another very important element or user of the system, who is the closest to the client. The Agent can therefore render services to the client on demand. 
Since the institution can have many Branches and many Agents, it is important to precise that each Agent is assigned to a given Zone (Geographical area). The creation of Zones and definition of the name given to a zone should be a setting that the Administrator will define. Therefore, we should have:
-	An interface or option that allow the administrator to create and manage zones
-	An option to assign one or more zones to a given Agent
-	Making sure that an agent can only access via his or her interface, the clients under his or her zone.


## Development Notes

- This PRD serves as the primary reference document for all development activities
- All features should align with the requirements specified in this document
- Security and financial compliance are paramount considerations
- The system must support both French and English languages
- Daily operations follow a strict session-based workflow

### Critical Implementation Requirements (Special Notations)

**1. Client Access Restriction (Special Notation #1):**
- Clients MUST NOT have direct access to their accounts through any interface
- No client dashboard, login, or account access interface should exist
- All client operations (deposits, withdrawals, transfers, savings, account statements) must be performed exclusively through Agents or Accountants
- Clients can only request services from Agents or Accountants - they cannot access the system directly

**2. Zone/Geographical Area Management (Special Notation #2):**
- Administrators must have an interface to create and manage Zones (Geographical areas)
- Each Zone must have a definable name set by the Administrator
- Administrators must be able to assign one or more Zones to each Agent
- Agents can ONLY access clients within their assigned Zones through their interface
- Zone assignment is a critical security and access control feature that must be enforced at the application level
