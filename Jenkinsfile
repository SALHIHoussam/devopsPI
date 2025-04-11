pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://localhost:27017'
        DB_NAME = 'foodWasteDB'
        SONARQUBE_SCANNER_HOME = tool 'SonarQubeScanner'
    }

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

        // New SonarQube Analysis Stage
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') { 
                    script {
                        sh """
                        ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=foodwaste-app \
                        -Dsonar.projectName=foodwaste-app \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=node_modules/**,**/*.spec.js \
                        -Dsonar.javascript.file.suffixes=.js \
                        -Dsonar.sourceEncoding=UTF-8
                        """
                    }
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    // Run in background and capture the process ID
                    sh 'nohup npm run dev & echo $! > app.pid'
                    // Wait for server to start (adjust sleep time as needed)
                    sh 'sleep 15'
                }
            }
        }

        stage('Docker Build and Run') {
            steps {
                script {
                    // Build Docker image
                    sh 'docker build -t foodwaste-app .'

                    // Stop and remove existing container if running
                    sh '''
                        if [ $(docker ps -aq -f name=foodwaste) ]; then
                            docker rm -f foodwaste || true
                        fi
                    '''

                    // Run Docker container
                    sh 'docker run -d --name foodwaste -p 5000:5000 foodwaste-app'
                }
            }
        }
    }

    post {
        always {
            script {
                // Cleanup: Kill the Node.js process if it's still running
                sh '''
                    if [ -f app.pid ]; then
                        kill $(cat app.pid) || true
                        rm -f app.pid
                    fi
                '''
            }
        }
        success {
            echo "Pipeline executed successfully! Your Node.js application was started and containerized."
        }
        failure {
            echo "Pipeline failed. Check the logs for errors."
        }
    }
}
