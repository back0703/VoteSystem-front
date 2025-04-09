const API_BASE_URL = 'localhost';

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
    `;
  container.appendChild(div);
}

// 创建投票
function createVote() {
  const title = document.getElementById("voteTitle").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const options = Array.from(document.querySelectorAll('.optionInput'))
    .map(input => input.value.trim())
    .filter(option => option.length > 0);
  if (!title || options.length < 2 || !startTime || !endTime) {
    alert("请填写所有必填项：投票主题、至少两个选项和时间设置！");
    return;
  }
  // 构造表单数据
  const formData = new URLSearchParams();
  formData.append("title", title);
  formData.append("startTime", startTime);
  formData.append("endTime", endTime);
  options.forEach(option => formData.append("options", option));
  // 调用后端 API 创建投票
  fetch(`http://${API_BASE_URL}:8080/api/votes/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData
  })
    .then(response => response.text())
    .then(voteId => {
      alert(`投票创建成功！ID: ${voteId}`);
      document.getElementById("voteTitle").value = "";
      document.getElementById("optionsContainer").innerHTML = `
        <div>
          <input type="text" class="optionInput" placeholder="选项1">
        </div>
      `;
      //重置表单
      resetCreateForm();
    })
    .catch(error => {
      console.error("创建投票失败：", error);
      alert("创建投票失败，请稍后重试！");
    });
}

//获取投票列表
function loadVoteList() {
  // 调用后端 API 获取所有投票
  fetch(`http://${API_BASE_URL}:8080/api/votes`)
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
              <div class="countdown" id="countdown-${voteId}"></div>
              <button onclick="castVote('${voteId}')">提交投票</button>
              <button onclick="showResults('${voteId}')">查看结果</button>
            </div>
          `;
      }).join("");
      Object.keys(votes).forEach(voteId => {
        const endTime = new Date(votes[voteId].endTime).getTime();
        const startTime = new Date(votes[voteId].startTime).getTime();
        updateCountdown(voteId, startTime, endTime);
      });
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
  fetch(`http://${API_BASE_URL}:8080/api/votes/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `voteId=${voteId}&option=${selectedOption.value}`
  })
    .then(response => response.text())
    .then(message => {
      alert(message);
      // 刷新投票列表
      loadVoteList();
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

// 默认打开“创建投票”选项卡
document.querySelector(".tablinks").click();

// 倒计时更新函数
function updateCountdown(voteId, startTime, endTime) {
  const timerElement = document.getElementById(`countdown-${voteId}`);
  if (!timerElement) {
    console.error(`未找到倒计时元素: countdown-${voteId}`);
    return;
  }
  let timer;
  const updateDisplay = () => {
    const now = new Date().getTime();
    const timeToStart = startTime - now;
    const timeToEnd = endTime - now;
    switch (true) {
      case timeToStart > 0: // 投票未开始
        const daysToStart = Math.floor(timeToStart / (1000 * 60 * 60 * 24));
        const hoursToStart = Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesToStart = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60));
        const secondsToStart = Math.floor((timeToStart % (1000 * 60)) / 1000);
        timerElement.innerHTML = `投票未开始，距离开始还有: ${daysToStart} 天 ${hoursToStart} 时 ${minutesToStart} 分 ${secondsToStart} 秒`;
        timerElement.style.color = "#FF9800";
        break;
      case timeToEnd > 0: // 投票进行中
        const days = Math.floor(timeToEnd / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeToEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeToEnd % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeToEnd % (1000 * 60)) / 1000);
        timerElement.innerHTML = `投票进行中，距离结束还有: ${days} 天 ${hours} 时 ${minutes} 分 ${seconds} 秒`;
        timerElement.style.color = "#4CAF50";
        break;
      default: // 投票已结束
        clearInterval(timer);
        timerElement.innerHTML = "投票已结束";
        timerElement.style.color = "#F44336";
        return;
    }
  };
  updateDisplay();
  timer = setInterval(updateDisplay, 1000);
  return timer;
}

//表单重置函数
function resetCreateForm() {
  document.getElementById("voteTitle").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("optionsContainer").innerHTML = `
    <div>
      <input type="text" class="optionInput" placeholder="选项1">
    </div>
  `;
}