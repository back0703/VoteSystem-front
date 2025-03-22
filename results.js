// 从URL中获取投票ID
const urlParams = new URLSearchParams(window.location.search);
const voteId = urlParams.get('voteId');

// 调用后端 API 获取投票结果
fetch(`http://localhost:8080/api/votes/results?voteId=${voteId}`)
    .then(response => response.json())
    .then(vote => {
        const ctx = document.getElementById('resultsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: vote.options,
                datasets: [{
                    label: '投票结果',
                    data: vote.options.map(opt => vote.results[opt]),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    })
    .catch(error => {
        console.error("加载投票结果失败：", error);
        document.getElementById('chartContainer').innerHTML = "<p>加载投票结果失败，请稍后重试！</p>";
    });