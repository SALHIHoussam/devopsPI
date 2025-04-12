pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://db:27017'  // Modifié pour utiliser le nom du service
        DB_NAME = 'foodWasteDB'
        REGISTRY = '192.168.33.10:8083'
        APP_IMAGE = "${REGISTRY}/nodemongoapp:6.0"
        NEXUS_CREDS = credentials('nexus')
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

        stage('Build and Push Docker Images') {
            steps {
                script {
                    // Construire l'image
                    sh "docker build -t ${APP_IMAGE} ."
                    
                    // Se connecter à Nexus et pousser l'image
                    withCredentials([usernamePassword(credentialsId: 'nexus', passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
                        sh "docker login -u ${NEXUS_USERNAME} -p ${NEXUS_PASSWORD} ${REGISTRY}"
                        sh "docker push ${APP_IMAGE}"
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    // Arrêter les conteneurs existants
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
                    
                    // Démarrer avec docker-compose
                    sh 'docker-compose up -d'
                }
            }
        }
    }

    post {
        always {
            script {
                // Nettoyage des processus et conteneurs
                sh '''
                    if [ -f app.pid ]; then
                        kill $(cat app.pid) || true
                        rm -f app.pid
                    fi
                '''
            }
        }

        success {
            echo "✅ Pipeline exécuté avec succès! Application disponible sur http://192.168.33.10:5000"
        }

        failure {
            echo "❌ Échec du pipeline. Consultez les logs pour plus de détails."
        }
    }
}
