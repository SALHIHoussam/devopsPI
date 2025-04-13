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
        PROMETHEUS_PORT = '9090'
        GRAFANA_PORT = '3000'
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

        stage('Setup Monitoring Stack') {
            steps {
                script {
                    // Installer le plugin Prometheus dans Jenkins
                    sh '''
                        echo "Vérification de l'installation du plugin Prometheus..."
                        curl -X POST http://localhost:8080/restart -u admin:$(cat /var/lib/jenkins/secrets/initialAdminPassword)
                    '''
                    
                    // Démarrer Prometheus
                    sh """
                        docker run -d --name prometheus \
                        -p ${PROMETHEUS_PORT}:9090 \
                        -v ${WORKSPACE}/prometheus:/etc/prometheus \
                        prom/prometheus
                        
                        # Attendre que Prometheus soit opérationnel
                        while ! curl -s http://localhost:${PROMETHEUS_PORT}; do sleep 1; done
                    """
                    
                    // Configurer Prometheus
                    sh """
                        cat <<EOF > ${WORKSPACE}/prometheus/prometheus.yml
                        global:
                          scrape_interval: 15s
                        
                        scrape_configs:
                          - job_name: 'jenkins'
                            metrics_path: '/prometheus'
                            static_configs:
                              - targets: ['172.17.0.1:8080']
                          - job_name: 'node_app'
                            static_configs:
                              - targets: ['192.168.33.10:5000']
                        EOF
                        
                        docker restart prometheus
                    """
                    
                    // Démarrer Grafana
                    sh """
                        docker run -d --name grafana \
                        -p ${GRAFANA_PORT}:3000 \
                        -v ${WORKSPACE}/grafana:/var/lib/grafana \
                        grafana/grafana
                    """
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
                                
                                echo "Pushing image to Docker Hub..."
                                docker push $DOCKERHUB_REPO:latest || exit 1
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
        
        stage('Configure Grafana') {
            steps {
                script {
                    // Configurer Grafana automatiquement
                    sh """
                        # Attendre que Grafana soit prêt
                        while ! curl -s http://localhost:${GRAFANA_PORT}; do sleep 1; done
                        
                        # Ajouter la source de données Prometheus
                        curl -X POST "http://localhost:${GRAFANA_PORT}/api/datasources" \
                        -u admin:admin \
                        -H "Content-Type: application/json" \
                        --data '{
                            "name":"Prometheus",
                            "type":"prometheus",
                            "url":"http://prometheus:9090",
                            "access":"proxy",
                            "basicAuth":false
                        }'
                        
                        # Importer le dashboard Jenkins
                        curl -X POST "http://localhost:${GRAFANA_PORT}/api/dashboards/import" \
                        -u admin:admin \
                        -H "Content-Type: application/json" \
                        --data '{
                            "dashboard":{
                                "id":9964,
                                "title":"Jenkins Monitoring"
                            },
                            "folderId":0,
                            "overwrite":true
                        }'
                        
                        # Changer le mot de passe admin
                        curl -X PUT "http://localhost:${GRAFANA_PORT}/api/user/password" \
                        -u admin:admin \
                        -H "Content-Type: application/json" \
                        --data '{
                            "oldPassword":"admin",
                            "newPassword":"grafana123"
                        }'
                    """
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
            script {
                echo "✅ Pipeline executed successfully!"
                echo "Application URL: http://192.168.33.10:5000"
                echo "Prometheus URL: http://192.168.33.10:${PROMETHEUS_PORT}"
                echo "Grafana URL: http://192.168.33.10:${GRAFANA_PORT} (admin/grafana123)"
            }
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
