# Use an official C++ runtime as a parent image
FROM gcc:latest as dependency-stage

# Set the working directory in the container
WORKDIR /usr/src/app

# Install any needed packages specified in requirements.txt
RUN apt-get update && apt-get install -y cmake make git curl zip unzip tar ninja-build
# Clone the vcpkg repository
RUN git clone https://github.com/Microsoft/vcpkg.git /vcpkg

# Set the VCPKG_FORCE_SYSTEM_BINARIES environment variable
# This is necessary on certain platforms as indicated by the error message

ENV VCPKG_FORCE_SYSTEM_BINARIES=1

# Run the vcpkg bootstrap script
RUN cd /vcpkg && ./bootstrap-vcpkg.sh

# Install any dependencies using vcpkg, for example:
RUN /vcpkg/vcpkg install drogon
RUN /vcpkg/vcpkg install libpqxx


# Stage 2: Application build
FROM gcc:latest as build-stage

COPY --from=dependency-stage /vcpkg /vcpkg


# Copy the current directory contents into the container at /usr/src/app
COPY . .

RUN apt-get update && apt-get install -y cmake make git curl zip unzip tar ninja-build


ENV VCPKG_ROOT=/vcpkg

# Run cmake to configure the project and make to build it
RUN sh -c "rm build/ 2> /dev/null; mkdir build && cd build && cmake .. && cmake --build ."
# For example, if the toolchain file is in your project directory:

# Make port 80 available to the world outside this container
EXPOSE 8090

# Define environment variable
ENV NAME World

# Run the output program from the previous step
CMD ["./build/MyProject"]