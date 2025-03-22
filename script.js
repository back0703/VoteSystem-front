// 打开选项卡
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // 切换到“参与投票”时加载投票列表
    if (tabName === 'vote') {
        loadVoteList();
    }
}

// 添加选项
function addOption() {
    const container = document.getElementById("optionsContainer");
    const div = document.createElement("div");
    div.innerHTML = `
      <input type="text" class="optionInput" placeholder="选项${container.children.length + 1}">
      <span class="removeOption" onclick="removeOption(this)"><i class="fas fa-times"></i></span>
    `;
    container.appendChild(div);
}

// 移除选项
function removeOption(element) {
    element.parentElement.remove();
}

// 创建投票
function createVote() {
    const title = document.getElementById("voteTitle").value;
    const options = Array.from(document.querySelectorAll('.optionInput'))
        .map(input => input.value.trim())
        .filter(option => option.length > 0);

    if (!title || options.length < 2) {
        alert("请填写投票主题并至少提供两个选项！");
        return;
    }

    // 调用后端 API 创建投票
    fetch('http://localhost:8080/api/votes/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `title=${encodeURIComponent(title)}&${options.map((o, i) => `options=${encodeURIComponent(o)}`).join('&')}`
    })
        .then(response => response.text())
        .then(voteId => {
            alert(`投票创建成功！ID: ${voteId}`);
            document.getElementById("voteTitle").value = "";
            document.getElementById("optionsContainer").innerHTML = `
        <div>
          <input type="text" class="optionInput" placeholder="选项1">
          <span class="removeOption" onclick="removeOption(this)"><i class="fas fa-times"></i></span>
        </div>
      `;
        })
        .catch(error => {
            console.error("创建投票失败：", error);
            alert("创建投票失败，请稍后重试！");
        });
}

function loadVoteList() {
    // 调用后端 API 获取所有投票
    fetch('http://localhost:8080/api/votes')
      .then(response => {
        if (!response.ok) {
          throw new Error("网络响应异常");
        }
        return response.json();
      })
      .then(votes => {
        const voteList = document.getElementById("voteList");
        if (!votes) {
          throw new Error("投票数据为空");
        }
        voteList.innerHTML = Object.keys(votes).map(voteId => {
          const vote = votes[voteId];
          if (!vote.options) {
            console.error("投票数据缺少 options 字段：", vote);
            return ""; // 跳过无效的投票数据
          }
          return `
            <div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc;">
              <h3>${vote.title}</h3>
              ${vote.options.map(opt => `
                <label>
                  <input type="radio" name="${voteId}" value="${opt}"> ${opt}
                </label><br>
              `).join("")}
              <button onclick="castVote('${voteId}')">提交投票</button>
              <button onclick="showResults('${voteId}')">查看结果</button>
            </div>
          `;
        }).join("");
      })
      .catch(error => {
        console.error("加载投票列表失败：", error);
        alert("加载投票列表失败，请稍后重试！");
      });
  }

// 提交投票
function castVote(voteId) {
    const selectedOption = document.querySelector(`input[name="${voteId}"]:checked`);
    if (!selectedOption) {
        alert("请选择一个选项！");
        return;
    }

    // 调用后端 API 提交投票
    fetch('http://localhost:8080/api/votes/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `voteId=${voteId}&option=${selectedOption.value}`
    })
        .then(response => response.text())
        .then(message => {
            alert(message);
            loadVoteList(); // 刷新投票列表
        })
        .catch(error => {
            console.error("提交投票失败：", error);
            alert("提交投票失败，请稍后重试！");
        });
}

// 查看结果
function showResults(voteId) {
    // 跳转到结果页面，并传递投票ID
    window.location.href = `results.html?voteId=${voteId}`;
}

// 清除所有投票记录
function clearVotes() {
    if (confirm("确定要清除所有投票记录吗？此操作不可恢复！")) {
        fetch('http://localhost:8080/api/votes/clear', {
            method: 'POST'
        })
            .then(response => response.text())
            .then(message => {
                alert(message);
                loadVoteList(); // 刷新投票列表
            })
            .catch(error => {
                console.error("清除投票记录失败：", error);
                alert("清除投票记录失败，请稍后重试！");
            });
    }
}

// 默认打开“创建投票”选项卡
document.querySelector(".tablinks").click();