// 从URL中获取投票ID
const urlParams = new URLSearchParams(window.location.search);
const voteId = urlParams.get('voteId');
const API_BASE_URL = 'localhost';

// 调用后端 API 获取投票结果
fetch(`http://${API_BASE_URL}:8080/api/votes/results?voteId=${voteId}`)
    .then(response => response.json())
    .then(vote => {
        const ctx = document.getElementById('resultsChart').getContext('2d');
        // 计算总票数（用于显示百分比）
        const totalVotes = Object.values(vote.results).reduce((a, b) => a + b, 0);
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: vote.options,
                datasets: [{
                    label: '票数',
                    data: vote.options.map(opt => vote.results[opt]),
                    backgroundColor: 'rgba(165, 165, 165, 0.7)',
                    borderColor: 'rgba(166, 166, 166, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const percent = totalVotes > 0
                                    ? `(${Math.round((value / totalVotes) * 100)}%)`
                                    : '';
                                return `票数: ${value} ${percent}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: true
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    })
    .catch(error => {
        console.error("加载投票结果失败：", error);
        document.getElementById('chartContainer').innerHTML = "<p>加载投票结果失败，请稍后重试！</p>";
    });