# Extended JWKS Server Project

This project extends the basic JWKS (JSON Web Key Set) server from Project 1 to incorporate SQLite database storage for private keys, enhancing security and persistence.

## Overview of Extensions

Implemented the following extensions to the original Project 1 code:

1. **SQLite Integration**: 
   - Added SQLite database to store private keys persistently.
   - Created a database file named `totally_not_my_privateKeys.db`.

2. **Database Schema**:
   - Implemented the following table schema:
     ```sql
     CREATE TABLE IF NOT EXISTS keys(
         kid INTEGER PRIMARY KEY AUTOINCREMENT,
         key BLOB NOT NULL,
         exp INTEGER NOT NULL
     )
     ```

3. **Key Management**:
   - Modified key generation to store keys in the database.
   - Implemented key serialization (likely using PKCS1 PEM format) for database storage.
   - Generated and stored at least one expired key and one valid key.

4. **Updated POST:/auth Endpoint**:
   - Now retrieves private keys from the database.
   - Handles the "expired" query parameter to return either a valid or expired key.
   - Signs JWT with the retrieved key.

5. **Updated GET:/.well-known/jwks.json Endpoint**:
   - Now fetches all valid (non-expired) private keys from the database.
   - Creates JWKS response from the retrieved keys.

6. **Security Enhancements**:
   - Implemented parameterized queries to prevent SQL injection vulnerabilities.

## Technologies Used

- **Node.js**: Runtime environment
- **Express**: Web application framework
- **jsonwebtoken**: For JWT generation and handling
- **SQLite3**: For database operations

## Setup Instructions
1. **Clone the repository**:
   ```powershell
   git clone https://github.com/MoisesArr/Project2-Extending-the-server.git
  
2. Navigate to the project directory:
   ```powershell
   cd Project2-Extending-the-server
  
4. Install dependencies:
   ```powershell
   npm install

6. Start the server
   ```powershell
   node server.js

## Testing

To test the server:

- For coverage percent test
   ````powershell
   .\gradebot.exe project2
