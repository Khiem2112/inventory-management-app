# The foundation layer (Still stable, no need to change)
FROM continuumio/miniconda3
WORKDIR /app

RUN apt-get update && \
    apt-get install -y unixodbc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies and adding files
# Use the new, complete exported file
COPY exported-environment.yml environment.yml 

# Create the Conda environment
RUN conda env create -f environment.yml && conda clean -all

# Copy the rest of the application code
COPY . /app

# Setting metadata and Environment
EXPOSE 8000

# Defining run-time command configuration
# This structure ensures the app always runs INSIDE the activated Conda env
ENTRYPOINT ["conda", "run", "-n", "inventory-management-app", "--no-capture-output", "uvicorn"]
CMD ["main:app", "--host", "0.0.0.0", "--port", "8000"]