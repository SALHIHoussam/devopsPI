pipeline {
    agent any

    environment {
        DB_HOST = 'db'
        DB_NAME = 'foodWasteDB'
        REGISTRY = '192.168.33.10:8083'
        REGISTRY_CREDENTIALS = 'nexus'
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
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQube Scanner'
                    withSonarQubeEnv('sonar') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    sh 'docker-compose build'
                    
                    // Tag the built image for Nexus
                    sh 'docker tag foodwaste-app ${REGISTRY}/foodwaste-app:latest'
                }
            }
        }
        
        stage('Run Application') {
            steps {
                script {
                    // Stop and remove existing containers if they exist
                    sh '''
                        if [ $(docker ps -aq -f name=foodwaste-container) ]; then
                            docker stop foodwaste-container || true
                            docker rm -f foodwaste-container || true
                        fi
                        if [ $(docker ps -aq -f name=db) ]; then
                            docker stop db || true
                            docker rm -f db || true
                        fi
                    '''
                    
                    // Start the application with docker-compose
                    sh 'docker-compose up -d'
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                    if [ -f app.pid ]; then
                        kill $(cat app.pid) || true
                        rm -f app.pid
                    fi
                '''
            }
        }

        success {
            echo "✅ Pipeline executed successfully! Application is running at http://192.168.33.10:5000"
        }

        failure {
            echo "❌ Pipeline failed. Check the logs for details."
        }
    }
}
