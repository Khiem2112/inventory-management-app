import sqlalchemy as sa
import urllib
from sqlalchemy.orm import Session
# Your server details
server = '172.17.48.1,57931'
database = 'Inventory' # or 'master'
username = 'wsl_user'
password = 'haidang2015'

# Build the connection string.
# We must use 'TrustServerCertificate=yes' here, as we learned this is necessary.
params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={server};"
    f"DATABASE={database};"
    f"UID={username};"
    f"PWD={password};"
    "TrustServerCertificate=yes;"
)

# Create the SQLAlchemy engine
try:
    engine = sa.create_engine(f"mssql+pyodbc:///?odbc_connect={params}")
    # connection = engine.connect()
    
    connection = Session(bind = engine)

    # Run a simple query to confirm the connection
    print("Successfully connected to the database!")
    result = connection.execute(sa.text("SELECT * from [User]")).fetchall()
    print("Server Version:")
    print(result, type(result))

    # Close the connection
    connection.close()

except Exception as e:
    print(f"An error occurred: {e}")
    
