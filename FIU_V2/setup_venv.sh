#!/bin/bash

# LocalPulse Virtual Environment Setup Script
# This script sets up a clean virtual environment for the LocalPulse application

echo "🚀 Setting up LocalPulse Virtual Environment..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv localpulse_env

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source localpulse_env/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
echo "📋 Installing requirements..."
if [ -f "../requirments.txt" ]; then
    pip install -r ../requirments.txt
elif [ -f "requirments.txt" ]; then
    pip install -r requirments.txt
else
    echo "❌ Requirements file not found!"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created! Please edit it with your API keys."
else
    echo "ℹ️ .env file already exists."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To activate the virtual environment in the future, run:"
echo "  source localpulse_env/bin/activate"
echo ""
echo "To run the application:"
echo "  source localpulse_env/bin/activate"
echo "  streamlit run main4.py"
echo ""
echo "📚 Next steps:"
echo "1. Edit your .env file with the required API keys"
echo "2. See API_SETUP_GUIDE.md for help getting API keys"
echo "3. Run 'python config.py' to test your configuration"
echo "" 