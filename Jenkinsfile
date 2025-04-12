pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://localhost:27017'
        DB_NAME = 'foodWasteDB'
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

        stage('Build Application') {
            steps {
                script {
                    sh 'nohup npm run dev & echo $! > app.pid'
                    sh 'sleep 15'
                }
            }
        }

        stage('Building images (node and mongo)') {
            steps {
                script {
                    sh 'docker-compose build'
                }
            }
        }
        
        stage('Docker Build and Run') {
            steps {
                script {
                    sh 'docker build -t foodwaste-app .'
                    sh '''
                        if [ $(docker ps -aq -f name=foodwaste-container) ]; then
                            docker stop foodwaste-container || true
                            docker rm -f foodwaste-container || true
                        fi
                    '''
                    sh 'docker run -d --restart unless-stopped --name foodwaste-container -p 5000:5000 -e DB_HOST=${DB_HOST} -e DB_NAME=${DB_NAME} foodwaste-app'
                }
            }
        }
    }

    post {
        always {
            script {
                // Nettoyage uniquement du processus npm
                sh '''
                    if [ -f app.pid ]; then
                        kill $(cat app.pid) || true
                        rm -f app.pid
                    fi
                '''
            }
        }

        success {
            echo "✅ Pipeline executed successfully! Application is running at http://<your-server-ip>:5000"
        }

        failure {
            echo "❌ Pipeline failed. Check the logs for details."
        }
    }
}
