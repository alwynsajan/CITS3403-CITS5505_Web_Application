from models import db
from app import app  # Import the app to initialize the app context

# Create tables with app context
with app.app_context():

    # This will create the  tables defined tables in the database.
    db.create_all()  

    print("Database setup complete!")
