# Use Conda as the base image
FROM continuumio/miniconda3

# Set the main working directory
WORKDIR /app

# 1. Install all OS dependencies (prerequisites, MS repo, and drivers)
# We do this in one big step to keep the layers down.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        gnupg \
        build-essential \
        libffi-dev \
        libssl-dev \
        unixodbc-dev \
    # Add the Microsoft repo for Debian 12 (Bookworm)
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg \
    #
    # --- THIS IS THE CORRECTED LINE ---
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
    #
    # Install the drivers
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
        msodbcsql18 \
        mssql-tools18 \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python Dependencies using Conda
# Create a new environment named 'api_env'
COPY environment.yml .
RUN conda env create -f environment.yml -n api_env && \
    conda clean -a

# 3. Configure the Environment
# Set the PATH to explicitly use the new Conda environment
ENV PATH="/opt/conda/envs/api_env/bin:$PATH"

# 4. Copy your application code
# This copies main.py, app/core/config.py, etc.
COPY . /app

# 5. Final Metadata and Command
# This command uses the $PORT variable from Cloud Run
# and listens on 0.0.0.0 (all interfaces)
CMD uvicorn main:app --host 0.0.0.0 --port $PORT