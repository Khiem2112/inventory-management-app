# The foundation layer (Still stable, no need to change)
FROM continuumio/miniconda3
WORKDIR /app

RUN apt-get update && \
    apt-get install -y unixodbc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies and adding files
COPY environment.yml .

# Update base environment with our dependencies
RUN conda env update -n base -f environment.yml && \
    conda clean -a

# Copy the rest of the application code
COPY . /app

# Setting metadata and Environment
EXPOSE 8000

# Defining run-time command configuration
ENTRYPOINT ["uvicorn"]
CMD ["main:app", "--host", "0.0.0.0", "--port", "8000"]