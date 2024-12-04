from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field, EmailStr
from pymongo import MongoClient
from typing import List
from bson import ObjectId
from datetime import datetime
from starlette.middleware.cors import CORSMiddleware


client = MongoClient("mongodb+srv://myAtlasDBUser:Sai123@myatlasclusteredu.qifwasp.mongodb.net/?retryWrites=true&w=majority")
db = client["fintech_wallet_db"]
users_collection = db["users"]
transactions_collection = db["transactions"]
app = FastAPI()
origins = [
    "http://127.0.0.1:5500",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)


class User(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    wallet_balance: float = Field(default=0.0)

class Transaction(BaseModel):
    user_id: str
    transaction_type: str
    amount: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone_number: str
    wallet_balance: float = Field(default=0.0)
    @classmethod
    def from_mongo(cls, user):
        return cls(
            id=str(user["_id"]),  # Convert ObjectId to string
            name=user["name"],
            email=user["email"],
            phone_number=user["phone_number"],
            wallet_balance=user["wallet_balance"],
        )

def transaction_helper(transaction) -> dict:
    return {
        "transaction_id": str(transaction["_id"]),
        "user_id": transaction["user_id"],
        "transaction_type": transaction["transaction_type"],
        "amount": transaction["amount"],
        "timestamp": transaction["timestamp"]
    }

@app.post("/users", response_model=User)
async def create_user(user: User):
    """
    Create a new user in the database
    """
    new_user = user.dict()
    new_user["_id"] = ObjectId()  
    users_collection.insert_one(new_user)
    return user
@app.get("/users", response_model=List[UserResponse])
async def get_all_users():
    # Fetch all users from the collection
    users = list(users_collection.find())
    
    # Directly return the user data with '_id' as 'id'
    return [
        {
            "id": str(user["_id"]),  # Convert ObjectId to string and map it to "id"
            "name": user["name"],
            "email": user["email"],
            "phone_number": user["phone_number"],
            "wallet_balance": user["wallet_balance"]
        }
        for user in users
    ]

@app.get("/users/{id}", response_model=UserResponse)
async def get_user(id: str):
    user = users_collection.find_one({"_id": ObjectId(id)})
    
    if user:
        return UserResponse.from_mongo(user)
    
    raise HTTPException(status_code=404, detail="User not found")

@app.put("/users/{id}", response_model=User)
async def update_user(id: str, user: User):
    """
    Update user details by ID
    """
    updated_user = user.dict()
    
    # Update the user in the database
    result = users_collection.update_one({"_id": ObjectId(id)}, {"$set": updated_user})
    
    if result.modified_count:
        # Fetch the updated user data and return it as a response
        updated_user_data = users_collection.find_one({"_id": ObjectId(id)})
        if updated_user_data:
            # Convert ObjectId to string for compatibility with Pydantic model
            updated_user_data["id"] = str(updated_user_data["_id"])
            return updated_user_data  
        else:
            raise HTTPException(status_code=404, detail="User not found")
    
    raise HTTPException(status_code=404, detail="User not found")

@app.delete("/users/{id}", response_model=dict)
async def delete_user(id: str):
    print(f"Deleting user with ID: {id}")  # Log the ID to see what you're receiving
    try:
        object_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid user ID format: {id}")
    
    result = users_collection.delete_one({"_id": object_id})
    if result.deleted_count:
        return {"message": f"User {id} deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/transactions", response_model=Transaction)
async def add_transaction(transaction: Transaction):
    """
    Add a new transaction (credit or debit)
    """
    user = users_collection.find_one({"_id": ObjectId(transaction.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate wallet balance for debit transactions
    if transaction.transaction_type == "debit" and user["wallet_balance"] < transaction.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    # Update wallet balance for credit/debit transactions
    new_balance = user["wallet_balance"] + transaction.amount if transaction.transaction_type == "credit" else user["wallet_balance"] - transaction.amount
    users_collection.update_one({"_id": ObjectId(transaction.user_id)}, {"$set": {"wallet_balance": new_balance}})

    # Save transaction to the database
    new_transaction = transaction.dict()
    new_transaction["_id"] = ObjectId()
    transactions_collection.insert_one(new_transaction)
    return transaction_helper(new_transaction)
@app.get("/transactions", response_model=List[Transaction])
async def get_all_transactions():
    """
    Get all transactions
    """
    transactions = transactions_collection.find()
    return [transaction_helper(transaction) for transaction in transactions]

@app.get("/transactions/{user_id}", response_model=List[Transaction])
async def get_transactions(user_id: str):
    """
    Get all transactions for a specific user
    """
    transactions = transactions_collection.find({"user_id": user_id})
    return [transaction_helper(transaction) for transaction in transactions]
# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
