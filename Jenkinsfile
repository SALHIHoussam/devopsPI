pipeline {
    agent any
    
    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'devops', 
                    credentialsId: 'devopstoken', 
                    url: 'https://github.com/SALHIHoussam/devopsPI.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh 'npm install'
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    sh 'npm run dev'
                }
            }
        }
    }
    
    post {
        success {
            echo "Pipeline executed successfully! Your Node.js application is running in Docker containers."
        }
        failure {
            echo "Pipeline failed. Check the logs for errors."
        }
    }
}
