pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://localhost:27017'
        DB_NAME = 'foodWasteDB'
        SONARQUBE_SCANNER_HOME = tool 'SonarQube Scanner'
        SONARQUBE_URL = 'http://192.168.33.10:9000'
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
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    script {
                        sh """
                        ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=foodwaste-app \
                        -Dsonar.projectName=foodwaste-app \
                        -Dsonar.host.url=http://192.168.33.10:9000 \
                        -Dsonar.token=${SONAR_TOKEN} \
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
                    sh 'nohup npm run dev & echo $! > app.pid'
                    sh 'sleep 15'
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
                    sh 'docker run -d --name foodwaste-container -p 5000:5000 -e DB_HOST=${DB_HOST} -e DB_NAME=${DB_NAME} foodwaste-app'
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
                    docker ps -aq --filter "name=foodwaste-container" | xargs --no-run-if-empty docker stop || true
                    docker ps -aq --filter "name=foodwaste-container" | xargs --no-run-if-empty docker rm || true
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
