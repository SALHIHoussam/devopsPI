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

        stage('Setup Environment') {
            steps {
                script {
                    // Utilisation de Node.js préconfiguré dans Jenkins
                    def nodejs = tool name: 'NodeJS-18', type: 'nodejs'
                    env.PATH = "${nodejs}/bin:${env.PATH}"
                    
                    // Vérification des versions
                    sh 'node --version'
                    sh 'npm --version'
                }
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
                        sh "${scannerHome}/bin/sonar-scanner " +
                           "-Dsonar.nodejs.executable=\$(which node) " +
                           "-Dsonar.projectKey=foodwaste-app " +
                           "-Dsonar.projectName=FoodWaste-App"
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
                    sh """
                        until curl -sSf http://${registry} >/dev/null; do
                            echo "Waiting for Nexus to be available..."
                            sleep 5
                        done
                        
                        // Configuration Docker pour registry non sécurisé
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
                        sleep 15
                        
                        // Test de santé
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
