pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://db:27017'  // Changé de localhost à db pour correspondre au service dans docker-compose
        DB_NAME = 'foodWasteDB'
        registryCredentials = "nexus"
        registry = "192.168.33.10:8083"
        DOCKER_IMAGE = "${registry}/foodwaste-app:${env.BUILD_NUMBER}"  // Ajout d'un tag dynamique
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

        stage('SonarQube Setup') {
            steps {
                script {
                    // Installation de Node.js pour SonarQube
                    sh '''
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQube Scanner'
                    withSonarQubeEnv('sonar') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.nodejs.executable=$(which node) \
                            -Dsonar.projectKey=foodwaste-app \
                            -Dsonar.projectName=FoodWaste-App
                        """
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

        stage('Verify Nexus') {
            steps {
                script {
                    // Vérification que Nexus est accessible
                    sh """
                        until curl -sSf http://${registry} >/dev/null; do
                            echo "Waiting for Nexus to be available..."
                            sleep 5
                        done
                        
                        # Configuration Docker pour registry non sécurisé
                        sudo mkdir -p /etc/docker
                        echo '{ \"insecure-registries\":[\"${registry}\"] }' | sudo tee /etc/docker/daemon.json
                        sudo systemctl restart docker
                        sleep 5
                    """
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    sh "docker-compose build"
                    sh "docker tag mongo:4.2 ${registry}/mongo:4.2"
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                script {
                    docker.withRegistry("http://${registry}", registryCredentials) {
                        sh "docker push ${DOCKER_IMAGE}"
                        sh "docker push ${registry}/mongo:4.2"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    sh """
                        docker-compose down || true
                        docker-compose up -d
                        sleep 15  # Attendre le démarrage des services
                        
                        # Test de santé
                        curl -sSf http://localhost:5000/api >/dev/null || exit 1
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                    docker-compose down || true
                    [ -f app.pid ] && kill $(cat app.pid) || true
                    rm -f app.pid
                '''
                cleanWs()
            }
        }

        success {
            echo "✅ Pipeline executed successfully!"
            echo "Application URL: http://192.168.33.10:5000"
            echo "Nexus Repository: http://${registry}"
        }

        failure {
            echo "❌ Pipeline failed. Check the logs for details."
        }
    }
}
