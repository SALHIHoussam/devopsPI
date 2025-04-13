pipeline {
    agent any

    environment {
        DB_HOST = 'db'
        DB_NAME = 'foodWasteDB'
        REGISTRY = '192.168.33.10:8083'
        REGISTRY_CREDENTIALS = 'nexus'
        SONAR_HOST_URL = 'http://192.168.33.10:9000'
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
                    // Add connection test and make stage non-blocking
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        def scannerHome = tool 'SonarQube Scanner'
                        withSonarQubeEnv('sonar') {
                            sh """
                                echo "Testing SonarQube connection..."
                                curl -I ${SONAR_HOST_URL} || echo "SonarQube connection test failed"
                                ${scannerHome}/bin/sonar-scanner -Dsonar.host.url=${SONAR_HOST_URL}
                            """
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    sh 'docker-compose build'
                    sh 'docker tag foodwaste-app ${REGISTRY}/foodwaste-app:latest'
                }
            }
        }
        
        stage('Deploy to Nexus') {
            steps {
                script {
                    retry(3) {
                        docker.withRegistry("http://${REGISTRY}", REGISTRY_CREDENTIALS) {
                            sh 'docker push ${REGISTRY}/foodwaste-app:latest'
                        }
                    }
                }
            }
        }
        
        stage('Run Application') {
            steps {
                script {
                    // More efficient container cleanup using docker-compose
                    sh '''
                        docker-compose down || true
                        docker rm -f foodwaste-container db || true
                    '''
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
