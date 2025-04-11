pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://localhost:27017'
        DB_NAME = 'foodWasteDB'

        // Ce nom DOIT correspondre à l'outil défini dans "Global Tool Configuration"
        SONARQUBE_SCANNER_HOME = tool 'SonarQube Scanner'
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
                withSonarQubeEnv('SonarQube') { // Ce nom DOIT correspond à celui déclaré dans "SonarQube Servers"
                    script {
                        sh """
                        ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=foodwaste-app \
                        -Dsonar.projectName=foodwaste-app \
                        -Dsonar.sources=src \
                        -Dsonar.tests=test \
                        -Dsonar.exclusions=node_modules/**,dist/**,coverage/**,**/*.spec.js \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        -Dsonar.sourceEncoding=UTF-8
                        """
                    }
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    // Lancer le serveur en arrière-plan
                    sh 'nohup npm run dev & echo $! > app.pid'
                    sh 'sleep 15' // attendre que le serveur démarre (à ajuster si nécessaire)
                }
            }
        }

        stage('Docker Build and Run') {
            steps {
                script {
                    // Build de l’image
                    sh 'docker build -t foodwaste-app .'

                    // Supprimer un conteneur existant s’il y en a un
                    sh '''
                        if [ $(docker ps -aq -f name=foodwaste) ]; then
                            docker rm -f foodwaste || true
                        fi
                    '''

                    // Lancer le conteneur
                    sh 'docker run -d --name foodwaste -p 5000:5000 foodwaste-app'
                }
            }
        }
    }

    post {
        always {
            script {
                node {
                    // Arrêter le serveur Node.js lancé manuellement
                    sh '''
                        if [ -f app.pid ]; then
                            kill $(cat app.pid) || true
                            rm -f app.pid
                        fi
                    '''
                }
            }
        }

        success {
            echo "✅ Pipeline executed successfully! Your Node.js application was built, scanned and containerized."
        }

        failure {
            echo "❌ Pipeline failed. Check the logs for details."
        }
    }
}
