pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://db:27017'
        DB_NAME = 'foodWasteDB'
        registryCredentials = "nexus"
        registry = "192.168.33.10:8083"
        DOCKER_IMAGE = "${registry}/foodwaste-app:${env.BUILD_NUMBER}"
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
        
        stage('Unit Tests') {
            steps {
                script {
                    sh 'npm test'
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
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Build de l'image de l'application
                    sh "docker build -t ${DOCKER_IMAGE} ."
                    
                    // Tag de l'image MongoDB pour Nexus
                    sh "docker tag mongo:4.2 ${registry}/mongo:4.2"
                }
            }
        }
        
        stage('Push to Nexus') {
            steps {
                script {
                    docker.withRegistry("http://${registry}", registryCredentials) {
                        // Push de l'image application
                        sh "docker push ${DOCKER_IMAGE}"
                        
                        // Push de l'image MongoDB
                        sh "docker push ${registry}/mongo:4.2"
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    // Arrêt des conteneurs existants
                    sh '''
                        docker-compose down || true
                        docker stop foodwaste-container || true
                        docker rm foodwaste-container || true
                    '''
                    
                    // Lancement avec docker-compose
                    sh "docker-compose up -d"
                    
                    // Vérification du statut
                    sh 'docker ps'
                    sh 'sleep 30' // Attente pour le démarrage complet
                }
            }
        }

        stage('Smoke Test') {
            steps {
                script {
                    // Test simple pour vérifier que l'application répond
                    sh '''
                        curl -sSf http://localhost:5000/api > /dev/null || exit 1
                        echo "Application is responding correctly"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                // Nettoyage
                sh '''
                    docker-compose down || true
                    docker rmi -f ${DOCKER_IMAGE} || true
                '''
                cleanWs()
            }
        }

        success {
            echo "✅ Pipeline executed successfully!"
            echo "Application URL: http://192.168.33.10:5000"
            echo "Nexus Repository: http://192.168.33.10:8081"
        }

        failure {
            echo "❌ Pipeline failed. Check the logs for details."
            slackSend channel: '#devops-alerts',
                      color: 'danger',
                      message: "Build ${env.BUILD_NUMBER} failed - ${env.BUILD_URL}"
        }
    }
}
