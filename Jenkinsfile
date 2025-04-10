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

        stage('Build Application') {
            steps {
                script {
                    // Run in background and capture the process ID
                    sh 'nohup npm run dev & echo $! > app.pid'
                    // Wait for server to start (adjust sleep time as needed)
                    sh 'sleep 15'
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Cleanup: Kill the Node.js process if it's still running
                sh '''
                    if [ -f app.pid ]; then
                        kill $(cat app.pid) || true
                        rm -f app.pid
                    fi
                '''
            }
        }
        success {
            echo "Pipeline executed successfully! Your Node.js application was started."
        }
        failure {
            echo "Pipeline failed. Check the logs for errors."
        }
    }
}
