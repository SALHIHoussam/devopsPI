pipeline {
    agent any

    environment {
        DB_HOST = 'db'
        DB_NAME = 'foodWasteDB'
        REGISTRY = '192.168.33.10:8083'
        REGISTRY_CREDENTIALS = 'nexus'
        DOCKERHUB_REGISTRY = 'docker.io'
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
        DOCKERHUB_REPO = 'salhihoussam/foodwaste-app' 
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
                    sh 'docker tag foodwaste-app ${DOCKERHUB_REPO}:latest' 
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
        
        stage('Deploy to DockerHub') {
            steps {
                script {
                    retry(3) {
                        withCredentials([usernamePassword(
                            credentialsId: 'dockerhub-credentials',
                            usernameVariable: 'DOCKERHUB_USERNAME',
                            passwordVariable: 'DOCKERHUB_PASSWORD'
                        )]) {
                            sh '''
                                echo "Logging in to Docker Hub..."
                                docker login -u $DOCKERHUB_USERNAME -p $DOCKERHUB_PASSWORD $DOCKERHUB_REGISTRY
                                
                                echo "Pushing image to Docker Hub (will create repo if needed)..."
                                docker push $DOCKERHUB_REPO:latest || exit 1
                                
                                echo "Docker Hub push completed successfully"
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Run Application') {
            steps {
                script {
                    // Cleanup existing containers
                    sh '''
                        docker-compose down || true
                        docker rm -f foodwaste-container db || true
                    '''
                    
                    // Pull the image from Nexus and run
                    docker.withRegistry("http://${REGISTRY}", REGISTRY_CREDENTIALS) {
                        sh '''
                            docker pull ${REGISTRY}/foodwaste-app:latest
                            docker-compose up -d
                        '''
                    }
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
            script {
                echo "❌ Pipeline failed in stage: ${currentBuild.currentResult}"
                if (currentBuild.currentResult == 'FAILURE') {
                    def failedStage = currentBuild.rawBuild.getExecution().getStages().find { it.status.toString() == 'FAILED' }
                    echo "Failure occurred in stage: ${failedStage?.name ?: 'Unknown'}"
                }
            }
        }

        unstable {
            echo "⚠️ Pipeline completed with unstable results (likely SonarQube quality gate)"
        }
    }
}
