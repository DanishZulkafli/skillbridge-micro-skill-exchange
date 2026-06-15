const STORAGE_KEY = "skillbridge-data";

function getData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    offers: [],
    requests: []
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function scrollToForms() {
  document.getElementById("forms").scrollIntoView({
    behavior: "smooth"
  });
}

function splitKeywords(text) {
  return text
    .toLowerCase()
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function addOffer() {
  const name = document.getElementById("offerName").value.trim();
  const title = document.getElementById("offerTitle").value.trim();
  const category = document.getElementById("offerCategory").value;
  const keywords = document.getElementById("offerKeywords").value.trim();
  const availability = document.getElementById("offerAvailability").value;
  const description = document.getElementById("offerDescription").value.trim();

  if (!name || !title || !keywords || !description) {
    alert("Please fill in all offer fields.");
    return;
  }

  const data = getData();

  data.offers.unshift({
    id: Date.now(),
    name,
    title,
    category,
    keywords,
    availability,
    description,
    createdAt: new Date().toISOString()
  });

  saveData(data);

  document.getElementById("offerName").value = "";
  document.getElementById("offerTitle").value = "";
  document.getElementById("offerKeywords").value = "";
  document.getElementById("offerDescription").value = "";

  renderApp();
}

function addRequest() {
  const name = document.getElementById("requestName").value.trim();
  const title = document.getElementById("requestTitle").value.trim();
  const category = document.getElementById("requestCategory").value;
  const keywords = document.getElementById("requestKeywords").value.trim();
  const urgency = document.getElementById("requestUrgency").value;
  const description = document.getElementById("requestDescription").value.trim();

  if (!name || !title || !keywords || !description) {
    alert("Please fill in all request fields.");
    return;
  }

  const data = getData();

  data.requests.unshift({
    id: Date.now(),
    name,
    title,
    category,
    keywords,
    urgency,
    description,
    createdAt: new Date().toISOString()
  });

  saveData(data);

  document.getElementById("requestName").value = "";
  document.getElementById("requestTitle").value = "";
  document.getElementById("requestKeywords").value = "";
  document.getElementById("requestDescription").value = "";

  renderApp();
}

function deleteItem(type, id) {
  const confirmed = confirm("Delete this item?");
  if (!confirmed) return;

  const data = getData();

  if (type === "Offer") {
    data.offers = data.offers.filter(item => item.id !== id);
  } else {
    data.requests = data.requests.filter(item => item.id !== id);
  }

  saveData(data);
  renderApp();
}

function calculateMatch(offer, request) {
  let score = 0;
  const reasons = [];

  if (offer.category === request.category) {
    score += 35;
    reasons.push("Same category");
  }

  const offerKeywords = splitKeywords(offer.keywords);
  const requestKeywords = splitKeywords(request.keywords);
  const matchedKeywords = offerKeywords.filter(keyword => requestKeywords.includes(keyword));

  if (matchedKeywords.length > 0) {
    score += Math.min(35, matchedKeywords.length * 15);
    reasons.push(`Matched keywords: ${matchedKeywords.join(", ")}`);
  }

  if (request.urgency === "High") {
    score += 10;
    reasons.push("High urgency request");
  }

  if (offer.availability === "Flexible" || offer.availability === "Weekend") {
    score += 10;
    reasons.push("Good availability");
  }

  return {
    score: Math.min(score, 100),
    reasons,
    matchedKeywords
  };
}

function getMatches(data) {
  const matches = [];

  data.offers.forEach(offer => {
    data.requests.forEach(request => {
      const match = calculateMatch(offer, request);

      if (match.score >= 35) {
        matches.push({
          offer,
          request,
          score: match.score,
          reasons: match.reasons
        });
      }
    });
  });

  return matches.sort((a, b) => b.score - a.score);
}

function getCommunityRank(points) {
  if (points >= 500) return "Skill Exchange Champion";
  if (points >= 250) return "Community Connector";
  if (points >= 100) return "Active Skill Builder";
  if (points >= 50) return "Helpful Member";
  return "Starter Network";
}

function renderDashboard(data, matches) {
  const categories = new Set([
    ...data.offers.map(item => item.category),
    ...data.requests.map(item => item.category)
  ]);

  const points = (data.offers.length * 15) + (data.requests.length * 10) + (matches.length * 20);

  document.getElementById("totalOffers").textContent = data.offers.length;
  document.getElementById("totalRequests").textContent = data.requests.length;
  document.getElementById("totalMatches").textContent = matches.length;
  document.getElementById("totalCategories").textContent = categories.size;
  document.getElementById("communityPoints").textContent = `${points} exchange points`;
  document.getElementById("communityRank").textContent = getCommunityRank(points);
}

function renderMatches(matches) {
  const box = document.getElementById("matchesList");

  if (matches.length === 0) {
    box.innerHTML = `
      <div class="empty-box">
        <h3>No matches yet</h3>
        <p>Add at least one offer and one request to generate matches.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = matches.map(match => `
    <div class="match-card">
      <div class="match-score">${match.score}% Match</div>
      <p>${match.reasons.join(" • ")}</p>

      <div class="match-grid">
        <div class="mini-card">
          <span class="pill offer">Offer</span>
          <h3>${match.offer.title}</h3>
          <p><strong>By:</strong> ${match.offer.name}</p>
          <p><strong>Skills:</strong> ${match.offer.keywords}</p>
          <p><strong>Availability:</strong> ${match.offer.availability}</p>
        </div>

        <div class="mini-card">
          <span class="pill request">Request</span>
          <h3>${match.request.title}</h3>
          <p><strong>By:</strong> ${match.request.name}</p>
          <p><strong>Needs:</strong> ${match.request.keywords}</p>
          <p><strong>Urgency:</strong> ${match.request.urgency}</p>
        </div>
      </div>
    </div>
  `).join("");
}

function renderCategoryBreakdown(data) {
  const box = document.getElementById("categoryBreakdown");
  const stats = {};

  [...data.offers, ...data.requests].forEach(item => {
    stats[item.category] = (stats[item.category] || 0) + 1;
  });

  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    box.innerHTML = `<p class="muted">No category data yet.</p>`;
    return;
  }

  const max = Math.max(...entries.map(item => item[1]));

  box.innerHTML = entries.map(([category, count]) => {
    const percentage = Math.round((count / max) * 100);

    return `
      <div class="breakdown-item">
        <div class="breakdown-top">
          <span>${category}</span>
          <span>${count} items</span>
        </div>
        <div class="breakdown-bg">
          <div class="breakdown-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderInsight(data, matches) {
  const insight = document.getElementById("communityInsight");

  if (data.offers.length === 0 && data.requests.length === 0) {
    insight.textContent = "Start by adding one skill offer and one help request to activate the exchange network.";
    return;
  }

  if (data.offers.length === 0) {
    insight.textContent = "The board has requests but no offers yet. Encourage people to share skills they can teach.";
    return;
  }

  if (data.requests.length === 0) {
    insight.textContent = "The board has offers but no help requests yet. Invite learners to post what support they need.";
    return;
  }

  if (matches.length === 0) {
    insight.textContent = "There are offers and requests, but no strong match yet. Try using clearer shared keywords.";
    return;
  }

  insight.textContent = `Great progress. ${matches.length} possible matches found. The community is starting to become active and useful.`;
}

function renderBoard(data) {
  const box = document.getElementById("boardList");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterType").value;

  const boardItems = [
    ...data.offers.map(item => ({ ...item, type: "Offer" })),
    ...data.requests.map(item => ({ ...item, type: "Request" }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let filtered = boardItems;

  if (filter !== "All") {
    filtered = filtered.filter(item => item.type === filter);
  }

  if (search) {
    filtered = filtered.filter(item => {
      const combined = `${item.name} ${item.title} ${item.category} ${item.keywords} ${item.description}`.toLowerCase();
      return combined.includes(search);
    });
  }

  if (filtered.length === 0) {
    box.innerHTML = `
      <div class="empty-box wide">
        <h3>No board items found</h3>
        <p>Add an offer/request or adjust your search/filter.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = filtered.map(item => `
    <article class="board-card">
      <span class="pill ${item.type === "Offer" ? "offer" : "request"}">${item.type}</span>
      <span class="pill">${item.category}</span>

      <h3>${item.title}</h3>
      <p>${item.description}</p>

      <p><strong>Name:</strong> ${item.name}</p>
      <p><strong>Keywords:</strong> ${item.keywords}</p>
      <p><strong>${item.type === "Offer" ? "Availability" : "Urgency"}:</strong> ${item.availability || item.urgency}</p>

      <button class="danger" onclick="deleteItem('${item.type}', ${item.id})">Delete</button>
    </article>
  `).join("");
}

function exportCSV() {
  const data = getData();
  const rows = [];

  data.offers.forEach(item => {
    rows.push(["Offer", item.name, item.title, item.category, item.keywords, item.availability, item.description]);
  });

  data.requests.forEach(item => {
    rows.push(["Request", item.name, item.title, item.category, item.keywords, item.urgency, item.description]);
  });

  if (rows.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers = ["Type", "Name", "Title", "Category", "Keywords", "Availability/Urgency", "Description"];

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "skillbridge-data.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function resetData() {
  const confirmed = confirm("Reset all SkillBridge data?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  renderApp();
}

function renderApp() {
  const data = getData();
  const matches = getMatches(data);

  renderDashboard(data, matches);
  renderMatches(matches);
  renderCategoryBreakdown(data);
  renderInsight(data, matches);
  renderBoard(data);
}

renderApp();
