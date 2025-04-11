pipeline {
    agent any

    environment {
        DB_HOST = 'mongodb://localhost:27017'
        DB_NAME = 'foodWasteDB'
        SONARQUBE_SCANNER_HOME = tool 'SonarQube Scanner'
        SONAR_TOKEN = credentials('sonar-token') 
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
                    // Generate coverage report if needed (uncomment if you have tests)
                    // sh 'npm test -- --coverage'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        timeout(time: 15, unit: 'MINUTES') {
                            sh """
                            ${SONARQUBE_SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.projectKey=foodwaste-app \
                            -Dsonar.projectName=foodwaste-app \
                            -Dsonar.sources=src \
                            -Dsonar.tests=test \
                            -Dsonar.exclusions=node_modules/**,dist/**,coverage/**,**/*.spec.js \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.sourceEncoding=UTF-8 \
                            -Dsonar.login=${SONAR_TOKEN}
                            """
                        }
                    }
                }
            }
            
            // Add quality gate check (optional)
            post {
                success {
                    script {
                        timeout(time: 5, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    // Start server in background
                    sh 'nohup npm run dev & echo $! > app.pid'
                    sh 'sleep 15' // Wait for server to start (adjust if needed)
                    
                    // Simple health check (optional)
                    sh 'curl -I http://localhost:5000 || true'
                }
            }
        }

        stage('Docker Build and Run') {
            steps {
                script {
                    // Build the image
                    sh 'docker build -t foodwaste-app .'
                    
                    // Clean up existing container if it exists
                    sh '''
                        if [ $(docker ps -aq -f name=foodwaste-container) ]; then
                            docker stop foodwaste-container || true
                            docker rm -f foodwaste-container || true
                        fi
                    '''
                    
                    // Run the container with environment variables
                    sh 'docker run -d --name foodwaste-container -p 5000:5000 -e DB_HOST=${DB_HOST} -e DB_NAME=${DB_NAME} foodwaste-app'
                    
                    // Verify container is running (optional)
                    sh 'docker ps | grep foodwaste-container'
                }
            }
        }
    }

    post {
        always {
            script {
                // Stop Node.js server if running
                sh '''
                    if [ -f app.pid ]; then
                        kill $(cat app.pid) || true
                        rm -f app.pid
                    fi
                '''
                
                // Clean up Docker (optional)
                sh '''
                    docker ps -aq --filter "name=foodwaste-container" | xargs --no-run-if-empty docker stop || true
                    docker ps -aq --filter "name=foodwaste-container" | xargs --no-run-if-empty docker rm || true
                '''
            }
        }

        success {
            echo "✅ Pipeline executed successfully! Your Node.js application was built, scanned and containerized."
            echo "Application should be available at: http://<your-server-ip>:5000"
        }

        failure {
            echo "❌ Pipeline failed. Check the logs for details."
            // You could add notification here (email, Slack, etc.)
        }
    }
}
