#!/usr/bin/env python3
"""
Script to initialize database and create test user for Integrations Service
"""
import asyncio
import sys
from uuid import UUID
from pathlib import Path

# Add the integrations service to path
sys.path.insert(0, str(Path(__file__).parent / "integrations-svc-ms2"))

from services.database import init_db, get_db, Base
from models.user import User, UserRead
from security.passwords import hash_password
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

TEST_USER_UUID = UUID("0283b6a0-f665-4041-bb21-75e5556835fc")

async def setup_test_user():
    """Initialize database and create test user"""
    print("Initializing database...")
    await init_db()
    print("Database initialized!")
    
    print("\nCreating test user...")
    async for db in get_db():
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.id == TEST_USER_UUID)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"Test user already exists: {existing_user.email}")
            return
        
        # Create test user
        test_user = User(
            id=TEST_USER_UUID,
            first_name="Test",
            last_name="User",
            email="test@example.com",
            hashed_password=hash_password("testpassword123"),
            is_active=True
        )
        
        db.add(test_user)
        await db.commit()
        await db.refresh(test_user)
        
        print(f"Test user created successfully!")
        print(f"  ID: {test_user.id}")
        print(f"  Email: {test_user.email}")
        print(f"  Name: {test_user.first_name} {test_user.last_name}")
        break

if __name__ == "__main__":
    asyncio.run(setup_test_user())

