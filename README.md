# Goal of project

The project is a web application built using Node.js, Express, and TypeScript that allows users to track their job applications and contacts during the job search process.

The main objective of the project is to provide users with a centralized platform where they can manage and organize their job applications effectively. Users can create, update, and delete job application records, along with associated contact details such as the name, email, and LinkedIn profile of the hiring manager or recruiter.

By using this application, users can keep track of important information related to each job application, such as the position applied for, the company name, application status, application date, and any notes or comments. Additionally, users can maintain a list of contacts they've interacted with during their job search, making it easier to follow up on applications and network with industry professionals.

Overall, the project aims to streamline the job search process and improve the efficiency of managing job applications and contacts, ultimately helping users land their desired job opportunities more effectively.

# Installation Guide

To run the code on your computer, you'll need to install Node.js and a Node.js package manager like npm or Yarn. Then, you can follow these steps to set up your development environment:

  1 - Clone the project:

    git clone https://github.com/diegomottadev/track-job-api.git
  
  2 - Install dependencies:
    
    npm install
    
  3 - Run the application
  
    npm run dev

  4 - Create a .env file in the root of the project with similar values:

    PORT=3000
    DB_HOST=localhost
    DB_NAME=<VALUE_DB_NAME>
    DB_USER=<VALUE_DB_USER>
    DB_PASS=<VALUE_DB_USER>
    AWS_ACCESS_KEY_ID=<VALUE_AWS_ACCESS_KEY_ID>
    AWS_SECRET_ACCESS_KEY=<VALUE_AWS_SECRET_ACCESS_KEY>
    AWS_REGION=<VALUE_AWS_REGION>

  Note: It is optional to configure an AWS S3 (Simple Storage Service) user and create a bucket with permissions to read and write images. The AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION should be replaced with your own values.

By following these steps and ensuring you have Node.js version 16.20.2 installed, you'll be able to use the project successfully.


