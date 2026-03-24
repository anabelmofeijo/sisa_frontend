document.addEventListener('DOMContentLoaded', function () {
  const logoutButtons = Array.from(document.querySelectorAll('.logout'));
  logoutButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      localStorage.removeItem('sisaToken');
      localStorage.removeItem('sisaUser');
      localStorage.removeItem('sisaLoginEmail');
      window.location.href = 'login.html';
    });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const profileNames = Array.from(document.querySelectorAll('.profile-name'));
  const profileRoles = Array.from(document.querySelectorAll('.profile-role'));

  if (!profileNames.length) {
    return;
  }

  const storedEmail = (localStorage.getItem('sisaLoginEmail') || '').trim().toLowerCase();
  if (!storedEmail || !window.SisaApi) {
    return;
  }

  function extractUsers(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && Array.isArray(payload.users)) {
      return payload.users;
    }

    if (payload && Array.isArray(payload.data)) {
      return payload.data;
    }

    return [];
  }

  function buildFullName(user) {
    const firstName = user && user.name ? String(user.name).trim() : '';
    const lastName = user && user.lastname ? String(user.lastname).trim() : '';
    return (firstName + ' ' + lastName).trim();
  }

  window.SisaApi.get('/users/list_users')
    .then(function (response) {
      const users = extractUsers(response);
      const currentUser = users.find(function (user) {
        return user && user.email && String(user.email).trim().toLowerCase() === storedEmail;
      });

      if (!currentUser) {
        return;
      }

      const fullName = buildFullName(currentUser) || storedEmail;

      profileNames.forEach(function (element) {
        element.textContent = fullName;
      });

      profileRoles.forEach(function (element) {
        element.textContent = 'Técnico';
      });
    })
    .catch(function () {
      profileRoles.forEach(function (element) {
        element.textContent = 'Técnico';
      });
    });
});

document.addEventListener('DOMContentLoaded', function () {
  const dateElement = document.getElementById('dashboard-date');
  const timeElement = document.getElementById('dashboard-time');

  if (!dateElement || !timeElement) {
    return;
  }

  function updateDashboardDateTime() {
    const now = new Date();
    dateElement.textContent = now.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    timeElement.textContent = now.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  updateDashboardDateTime();
  window.setInterval(updateDashboardDateTime, 1000);
});

document.addEventListener('DOMContentLoaded', function () {
  const batteryCards = Array.from(document.querySelectorAll('[data-battery-card], [data-battery-panel]'));
  if (!batteryCards.length || !window.SisaApi) {
    return;
  }

  const refreshIntervalMs = 5 * 60 * 1000;
  const batteryConfigs = [
    { name: 'first_batery', label: 'Bateria A' },
    { name: 'second_batery', label: 'Bateria B' }
  ];

  function extractList(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && Array.isArray(payload.data)) {
      return payload.data;
    }

    if (payload && Array.isArray(payload.batteries)) {
      return payload.batteries;
    }

    if (payload && Array.isArray(payload.items)) {
      return payload.items;
    }

    return [];
  }

  function toNumber(value) {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  function pickNumber(source, keys) {
    if (!source) {
      return null;
    }

    for (let index = 0; index < keys.length; index += 1) {
      const value = toNumber(source[keys[index]]);
      if (value !== null) {
        return value;
      }
    }

    return null;
  }

  function pickString(source, keys) {
    if (!source) {
      return '';
    }

    for (let index = 0; index < keys.length; index += 1) {
      const value = source[keys[index]];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  function clampPercent(value) {
    const safeValue = value === null ? 0 : value;
    return Math.max(0, Math.min(100, safeValue));
  }

  function healthLabelToPercent(value) {
    if (typeof value === 'number' && !isNaN(value)) {
      return clampPercent(value);
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'excellent') {
      return 100;
    }

    if (normalized === 'good') {
      return 85;
    }

    if (normalized === 'fair' || normalized === 'average') {
      return 65;
    }

    if (normalized === 'poor' || normalized === 'bad') {
      return 35;
    }

    return null;
  }

  function percentTone(percent) {
    if (percent >= 70) {
      return 'green';
    }

    if (percent >= 35) {
      return 'yellow';
    }

    return 'orange';
  }

  function deriveStatus(status, currentValue) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus) {
      if (normalizedStatus.indexOf('charge') !== -1 || normalizedStatus.indexOf('carreg') !== -1) {
        return 'A carregar';
      }

      if (
        normalizedStatus.indexOf('discharg') !== -1 ||
        normalizedStatus.indexOf('uso') !== -1 ||
        normalizedStatus.indexOf('active') !== -1
      ) {
        return 'Em uso';
      }

      if (normalizedStatus.indexOf('idle') !== -1 || normalizedStatus.indexOf('standby') !== -1) {
        return 'Em espera';
      }
    }

    if (typeof currentValue === 'number') {
      if (currentValue > 0) {
        return 'A carregar';
      }

      if (currentValue < 0) {
        return 'Em uso';
      }
    }

    return 'Em espera';
  }

  function deriveStatusClasses(status) {
    if (status === 'A carregar') {
      return {
        badge: 'gray',
        dot: 'green'
      };
    }

    if (status === 'Em uso') {
      return {
        badge: 'dark',
        dot: 'blue'
      };
    }

    return {
      badge: 'gray',
      dot: 'yellow'
    };
  }

  function formatMetric(value, suffix, digits) {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }

    return value.toFixed(digits) + suffix;
  }

  function setBatteryAsUnavailable(element) {
    const statusElement = element.querySelector('[data-battery-status]');
    const percentElement = element.querySelector('[data-battery-percent]');
    const progressElement = element.querySelector('[data-battery-progress]');
    const healthValue = element.querySelector('[data-battery-health]');
    const healthWrap = element.querySelector('[data-battery-health-wrap]');
    const temperatureValue = element.querySelector('[data-battery-temperature]');
    const voltageValue = element.querySelector('[data-battery-voltage]');
    const currentValue = element.querySelector('[data-battery-current]');
    const stateDot = element.querySelector('[data-battery-state-dot]');
    const chargeBox = element.querySelector('.charge-box');

    applyText(element, '[data-battery-status]', 'Sem dados');
    applyText(element, '[data-battery-percent]', '--');
    applyText(element, '[data-battery-health]', '--');
    applyText(element, '[data-battery-temperature]', '--');
    applyText(element, '[data-battery-voltage]', '--');
    applyText(element, '[data-battery-current]', '--');

    if (progressElement) {
      progressElement.style.width = '0%';
    }

    updateClassList(statusElement, ['gray', 'dark'], 'gray');
    updateClassList(percentElement, ['green', 'yellow', 'orange'], null);
    updateClassList(healthValue, ['green', 'yellow', 'orange'], null);
    updateClassList(healthWrap, ['green', 'yellow', 'orange'], null);
    updateClassList(stateDot, ['green', 'blue', 'yellow'], 'yellow');
    updateClassList(chargeBox, ['green', 'yellow', 'orange'], null);
  }

  function latestRecord(payload) {
    const list = extractList(payload).filter(Boolean);
    return list.length ? list[list.length - 1] : null;
  }

  function normalizeBatteryState(config, payload) {
    const record = latestRecord(payload);
    if (!record) {
      return null;
    }

    const charge = clampPercent(
      pickNumber(record, ['percentage', 'percent', 'charge_percentage', 'chargePercent', 'battery_percentage', 'soc', 'level'])
    );
    const health = healthLabelToPercent(record.health);
    const temperature = pickNumber(record, ['temperature']);
    const voltage = pickNumber(record, ['voltage']);
    const current = pickNumber(record, ['current']);
    const status = deriveStatus(
      pickString(record, ['status']),
      current
    );

    return {
      name: config.name,
      label: config.label,
      charge: charge,
      health: health === 0 ? null : health,
      temperature: temperature,
      voltage: voltage,
      current: current,
      status: status
    };
  }

  function applyText(root, selector, value) {
    const element = root.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function updateClassList(element, allowedClasses, nextClass) {
    if (!element) {
      return;
    }

    allowedClasses.forEach(function (className) {
      element.classList.remove(className);
    });

    if (nextClass) {
      element.classList.add(nextClass);
    }
  }

  function updateBatteryCard(element, state) {
    const tone = percentTone(state.charge);
    const statusClasses = deriveStatusClasses(state.status);
    const statusElement = element.querySelector('[data-battery-status]');
    const percentElement = element.querySelector('[data-battery-percent]');
    const progressElement = element.querySelector('[data-battery-progress]');
    const healthValue = element.querySelector('[data-battery-health]');
    const healthWrap = element.querySelector('[data-battery-health-wrap]');
    const temperatureValue = element.querySelector('[data-battery-temperature]');
    const voltageValue = element.querySelector('[data-battery-voltage]');
    const currentValue = element.querySelector('[data-battery-current]');
    const stateDot = element.querySelector('[data-battery-state-dot]');
    const chargeBox = element.querySelector('.charge-box');

    applyText(element, '[data-battery-status]', state.status);
    applyText(element, '[data-battery-percent]', Math.round(state.charge) + '%');
    applyText(element, '[data-battery-health]', state.health === null ? '--' : Math.round(state.health) + '%');
    applyText(element, '[data-battery-temperature]', formatMetric(state.temperature, '°C', 0));
    applyText(element, '[data-battery-voltage]', formatMetric(state.voltage, ' V', 1));
    applyText(element, '[data-battery-current]', formatMetric(state.current, ' A', 1));

    if (progressElement) {
      progressElement.style.width = state.charge.toFixed(1) + '%';
    }

    updateClassList(statusElement, ['gray', 'dark'], statusClasses.badge);
    updateClassList(percentElement, ['green', 'yellow', 'orange'], tone);
    updateClassList(healthValue, ['green', 'yellow', 'orange'], percentTone(state.health === null ? 0 : state.health));
    updateClassList(healthWrap, ['green', 'yellow', 'orange'], percentTone(state.health === null ? 0 : state.health));
    updateClassList(stateDot, ['green', 'blue', 'yellow'], statusClasses.dot);
    updateClassList(chargeBox, ['green', 'yellow', 'orange'], tone);
  }

  function updateBatterySummary(states) {
    const activeName = document.querySelector('[data-battery-active-name]');
    const activeStatus = document.querySelector('[data-battery-active-status]');
    const chargingName = document.querySelector('[data-battery-charging-name]');
    const chargingStatus = document.querySelector('[data-battery-charging-status]');

    if (!activeName && !chargingName) {
      return;
    }

    const activeBattery =
      states.find(function (state) { return state.status === 'Em uso'; }) ||
      states.slice().sort(function (left, right) { return right.charge - left.charge; })[0];
    const chargingBattery =
      states.find(function (state) { return state.status === 'A carregar'; }) ||
      states.slice().sort(function (left, right) { return left.charge - right.charge; })[0];

    if (activeBattery) {
      if (activeName) {
        activeName.textContent = activeBattery.label;
      }
      if (activeStatus) {
        activeStatus.textContent = 'A alimentar o sistema';
      }
    }

    if (chargingBattery) {
      if (chargingName) {
        chargingName.textContent = chargingBattery.label;
      }
      if (chargingStatus) {
        chargingStatus.textContent = Math.round(chargingBattery.charge) + '% carregada';
      }
    }
  }

  async function refreshBatteries() {
    try {
      const responses = await Promise.all(
        batteryConfigs.map(function (config) {
          return window.SisaApi.get('/batery/get_batteries_by_name/' + config.name);
        })
      );

      const normalizedStates = responses.map(function (response, index) {
        return {
          config: batteryConfigs[index],
          state: normalizeBatteryState(batteryConfigs[index], response)
        };
      });

      const states = normalizedStates
        .map(function (entry) {
          return entry.state;
        })
        .filter(Boolean);

      normalizedStates.forEach(function (entry) {
        const matchingCards = Array.from(
          document.querySelectorAll('[data-battery-card="' + entry.config.name + '"], [data-battery-panel="' + entry.config.name + '"]')
        );

        if (entry.state) {
          matchingCards.forEach(function (element) {
            updateBatteryCard(element, entry.state);
          });
          return;
        }

        matchingCards.forEach(function (element) {
          setBatteryAsUnavailable(element);
        });
      });

      updateBatterySummary(states);
    } catch (error) {
      console.error('Falha ao atualizar as baterias.', error);
    }
  }

  refreshBatteries();
  window.setInterval(refreshBatteries, refreshIntervalMs);
});

document.addEventListener('DOMContentLoaded', function () {
  const tabs = Array.from(document.querySelectorAll('.tab-btn[data-range]'));
  if (!tabs.length) {
    return;
  }

  const chartLineGreen = document.getElementById('chart-line-green');
  const chartLineBlue = document.getElementById('chart-line-blue');
  const chartAreaGreen = document.getElementById('chart-area-green');
  const chartAreaBlue = document.getElementById('chart-area-blue');
  const pointGreen = document.getElementById('point-green');
  const pointBlue = document.getElementById('point-blue');
  const lineHoverGuide = document.getElementById('line-hover-guide');

  const tooltip = document.getElementById('chart-tooltip');
  const tipTime = document.getElementById('tip-time');
  const tipGreen = document.getElementById('tip-green');
  const tipBlue = document.getElementById('tip-blue');

  const sourceRegFill = document.getElementById('source-reg-fill');
  const sourceSolFill = document.getElementById('source-sol-fill');
  const sourceRegLabel = document.getElementById('source-reg-label');
  const sourceSolLabel = document.getElementById('source-sol-label');

  const barsGroup = document.getElementById('bars-group');
  const barsLabels = document.getElementById('bars-labels');
  const barsTooltip = document.getElementById('bars-tooltip');
  const barsTipTime = document.getElementById('bars-tip-time');
  const barsTipValue = document.getElementById('bars-tip-value');
  const barsHoverGuide = document.getElementById('bars-hover-guide');

  const lineChartBox = document.getElementById('line-chart-box');
  const barsChartBox = document.getElementById('bars-chart-box');

  const kpiGerada = document.getElementById('kpi-gerada');
  const kpiConsumida = document.getElementById('kpi-consumida');
  const kpiArmazenada = document.getElementById('kpi-armazenada');

  const chartData = {
    daily: {
      labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
      generated: [1.1, 0.6, 2.7, 5.8, 7.4, 6.2, 8.1, 4.5],
      consumed: [0.9, 0.5, 1.9, 4.2, 5.1, 4.8, 6.1, 3.4],
      sourceReg: 58.2,
      sourceSolar: 41.8,
      building: [0.3, 0.3, 0.7, 1.6, 2.4, 1.4, 1.9, 1.0],
      focusIndex: 3
    },
    weekly: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom', 'Media'],
      generated: [4.1, 6.8, 7.5, 5.9, 6.4, 4.7, 3.8, 5.6],
      consumed: [3.4, 5.1, 5.8, 4.7, 5.2, 4.2, 3.2, 4.5],
      sourceReg: 54.0,
      sourceSolar: 46.0,
      building: [1.2, 1.6, 1.9, 1.4, 1.7, 1.1, 0.9, 1.4],
      focusIndex: 2
    },
    monthly: {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      generated: [3.5, 4.4, 6.2, 7.9, 6.8, 7.3, 6.1, 5.2],
      consumed: [2.8, 3.4, 4.7, 5.6, 5.0, 5.3, 4.5, 3.9],
      sourceReg: 51.7,
      sourceSolar: 48.3,
      building: [1.0, 1.2, 1.5, 1.9, 2.1, 1.8, 1.4, 1.2],
      focusIndex: 4
    }
  };

  const bounds = {
    xMin: 40,
    xMax: 940,
    yMin: 30,
    yMax: 230,
    lineMax: 12,
    barMax: 2.4,
    svgWidth: 960
  };

  const state = {
    currentRange: 'daily',
    currentIndex: 0,
    generatedPoints: [],
    consumedPoints: [],
    barCenters: [],
    barValues: [],
    labels: [],
    energySnapshot: null
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value) {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  function sum(values) {
    return values.reduce(function (acc, value) {
      return acc + value;
    }, 0);
  }

  function toPoints(values, maxValue) {
    const step = (bounds.xMax - bounds.xMin) / (values.length - 1);
    return values.map(function (value, index) {
      const x = bounds.xMin + step * index;
      const y = bounds.yMax - (value / maxValue) * (bounds.yMax - bounds.yMin);
      return { x: x, y: y };
    });
  }

  function linePath(points) {
    return points.map(function (point, index) {
      return (index === 0 ? 'M' : 'L') + point.x.toFixed(1) + ',' + point.y.toFixed(1);
    }).join(' ');
  }

  function areaPath(points) {
    return linePath(points) + ' L' + bounds.xMax + ',' + bounds.yMax + ' L' + bounds.xMin + ',' + bounds.yMax + ' Z';
  }

  function updateKpis(data) {
    if (state.energySnapshot) {
      kpiGerada.textContent = state.energySnapshot.generated.toFixed(1) + ' kWh';
      kpiConsumida.textContent = state.energySnapshot.consumed.toFixed(1) + ' kWh';
      kpiArmazenada.textContent = state.energySnapshot.stored.toFixed(1) + ' kWh';
      return;
    }

    if (state.energySnapshot === false) {
      kpiGerada.textContent = 'Sem dados';
      kpiConsumida.textContent = 'Sem dados';
      kpiArmazenada.textContent = 'Sem dados';
      return;
    }

    const totalGenerated = sum(data.generated);
    const totalConsumed = sum(data.consumed);
    const stored = Math.max((totalGenerated - totalConsumed) * 0.85 + 7, 0);

    kpiGerada.textContent = totalGenerated.toFixed(1) + ' kWh';
    kpiConsumida.textContent = totalConsumed.toFixed(1) + ' kWh';
    kpiArmazenada.textContent = stored.toFixed(1) + ' kWh';
  }

  function updateBarsFocus(index) {
    const safeIndex = clamp(index, 0, state.barValues.length - 1);
    state.currentIndex = safeIndex;

    const rects = barsGroup ? barsGroup.querySelectorAll('.bar-rect') : [];
    rects.forEach(function (rect, i) {
      rect.classList.toggle('active', i === safeIndex);
    });

    const x = state.barCenters[safeIndex];
    if (barsHoverGuide && x !== undefined) {
      barsHoverGuide.setAttribute('x1', x.toFixed(1));
      barsHoverGuide.setAttribute('x2', x.toFixed(1));
    }

    if (barsTooltip && barsTipTime && barsTipValue && x !== undefined) {
      barsTooltip.style.left = ((x / bounds.svgWidth) * 100).toFixed(2) + '%';
      barsTipTime.textContent = state.labels[safeIndex];
      barsTipValue.textContent = 'Energia para Edificio : ' + state.barValues[safeIndex].toFixed(1);
    }
  }

  function updateLineFocus(index) {
    const safeIndex = clamp(index, 0, state.generatedPoints.length - 1);
    state.currentIndex = safeIndex;

    const gPoint = state.generatedPoints[safeIndex];
    const cPoint = state.consumedPoints[safeIndex];
    const data = chartData[state.currentRange];

    pointGreen.setAttribute('cx', gPoint.x.toFixed(1));
    pointGreen.setAttribute('cy', gPoint.y.toFixed(1));
    pointBlue.setAttribute('cx', cPoint.x.toFixed(1));
    pointBlue.setAttribute('cy', cPoint.y.toFixed(1));

    if (lineHoverGuide) {
      lineHoverGuide.setAttribute('x1', gPoint.x.toFixed(1));
      lineHoverGuide.setAttribute('x2', gPoint.x.toFixed(1));
    }

    tooltip.style.left = ((gPoint.x / bounds.svgWidth) * 100).toFixed(2) + '%';
    tipTime.textContent = data.labels[safeIndex];
    tipGreen.textContent = 'Gerada : ' + data.generated[safeIndex].toFixed(1);
    tipBlue.textContent = 'Consumida : ' + data.consumed[safeIndex].toFixed(1);

  }

  function renderBars(labels, values, focusIdx) {
    if (!barsGroup || !barsLabels) {
      return;
    }

    const xMin = bounds.xMin;
    const xMax = bounds.xMax;
    const yMax = bounds.yMax;
    const yMin = bounds.yMin;
    const step = (xMax - xMin) / values.length;
    const barWidth = Math.min(90, step * 0.8);

    state.barCenters = [];
    state.barValues = values.slice();
    state.labels = labels.slice();

    barsGroup.innerHTML = '';
    barsLabels.innerHTML = '';

    values.forEach(function (value, index) {
      const h = (value / bounds.barMax) * (yMax - yMin);
      const x = xMin + index * step + (step - barWidth) / 2;
      const y = yMax - h;

      state.barCenters.push(x + barWidth / 2);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x.toFixed(1));
      rect.setAttribute('y', y.toFixed(1));
      rect.setAttribute('width', barWidth.toFixed(1));
      rect.setAttribute('height', h.toFixed(1));
      rect.setAttribute('rx', '8');
      rect.setAttribute('class', 'bar-rect' + (index === focusIdx ? ' active' : ''));
      barsGroup.appendChild(rect);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', (x + barWidth / 2).toFixed(1));
      label.setAttribute('y', '245');
      label.setAttribute('class', 'bar-label');
      label.textContent = labels[index];
      barsLabels.appendChild(label);
    });

    updateBarsFocus(focusIdx);
  }

  function renderCurrentRange(focusIdx) {
    const data = chartData[state.currentRange];
    const initialFocus = focusIdx === undefined ? data.focusIndex : focusIdx;

    state.generatedPoints = toPoints(data.generated, bounds.lineMax);
    state.consumedPoints = toPoints(data.consumed, bounds.lineMax);

    chartLineGreen.setAttribute('d', linePath(state.generatedPoints));
    chartLineBlue.setAttribute('d', linePath(state.consumedPoints));
    chartAreaGreen.setAttribute('d', areaPath(state.generatedPoints));
    chartAreaBlue.setAttribute('d', areaPath(state.consumedPoints));

    if (state.energySnapshot) {
      sourceRegFill.style.width = state.energySnapshot.origin.regeneration.toFixed(1) + '%';
      sourceSolFill.style.width = state.energySnapshot.origin.panel.toFixed(1) + '%';
      sourceRegLabel.textContent = state.energySnapshot.origin.regeneration.toFixed(1) + '%';
      sourceSolLabel.textContent = state.energySnapshot.origin.panel.toFixed(1) + '%';
    } else if (state.energySnapshot === false) {
      sourceRegFill.style.width = '0%';
      sourceSolFill.style.width = '0%';
      sourceRegLabel.textContent = 'Sem dados';
      sourceSolLabel.textContent = 'Sem dados';
    } else {
      sourceRegFill.style.width = data.sourceReg.toFixed(1) + '%';
      sourceSolFill.style.width = data.sourceSolar.toFixed(1) + '%';
      sourceRegLabel.textContent = data.sourceReg.toFixed(1) + '%';
      sourceSolLabel.textContent = data.sourceSolar.toFixed(1) + '%';
    }

    updateKpis(data);
    renderBars(data.labels, data.building, initialFocus);
    updateLineFocus(initialFocus);
  }

  function extractEnergyList(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && Array.isArray(payload.data)) {
      return payload.data;
    }

    if (payload && Array.isArray(payload.items)) {
      return payload.items;
    }

    return [];
  }

  function normalizeEnergySnapshot(entry) {
    if (!entry) {
      return null;
    }

    const energyOrigin = entry.energy_origin || {};
    const panel = toNumber(energyOrigin.panel) || 0;
    const regeneration = toNumber(energyOrigin.regeneration) || 0;
    const other = toNumber(energyOrigin.additionalProp3) || 0;
    const totalOrigin = panel + regeneration + other;

    return {
      generated: toNumber(entry.energy_generated) || 0,
      consumed: toNumber(entry.energy_consumed) || 0,
      stored: toNumber(entry.energy_stored) || 0,
      origin: {
        panel: totalOrigin > 0 ? (panel / totalOrigin) * 100 : 0,
        regeneration: totalOrigin > 0 ? (regeneration / totalOrigin) * 100 : 0
      }
    };
  }

  async function refreshEnergySnapshot() {
    if (!window.SisaApi) {
      return;
    }

    try {
      const response = await window.SisaApi.get('/energy/ist_energy');
      const list = extractEnergyList(response).filter(Boolean);
      if (!list.length) {
        state.energySnapshot = false;
        renderCurrentRange(state.currentIndex);
        return;
      }

      state.energySnapshot = normalizeEnergySnapshot(list[list.length - 1]);
      renderCurrentRange(state.currentIndex);
    } catch (error) {
      state.energySnapshot = false;
      renderCurrentRange(state.currentIndex);
      console.error('Falha ao atualizar energia.', error);
    }
  }

  function applyRange(range) {
    if (!chartData[range]) {
      return;
    }

    state.currentRange = range;

    tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.range === range);
    });

    renderCurrentRange(chartData[range].focusIndex);
  }

  function mouseIndexFromContainer(event, container, length) {
    const rect = container.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    return Math.round(ratio * (length - 1));
  }

  function startLiveUpdates() {
    setInterval(function () {
      const data = chartData[state.currentRange];

      data.generated = data.generated.map(function (value) {
        return clamp(value + (Math.random() - 0.5) * 0.28, 0.4, 11.6);
      });

      data.consumed = data.consumed.map(function (value, idx) {
        const maxAllowed = Math.max(data.generated[idx] - 0.2, 0.3);
        return clamp(value + (Math.random() - 0.5) * 0.22, 0.3, maxAllowed);
      });

      data.building = data.building.map(function (value) {
        return clamp(value + (Math.random() - 0.5) * 0.18, 0.2, bounds.barMax);
      });

      data.sourceReg = clamp(data.sourceReg + (Math.random() - 0.5) * 0.8, 45, 65);
      data.sourceSolar = 100 - data.sourceReg;

      renderCurrentRange(state.currentIndex);
    }, 4500);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      applyRange(tab.dataset.range);
    });
  });

  if (lineChartBox) {
    lineChartBox.addEventListener('mousemove', function (event) {
      const data = chartData[state.currentRange];
      const idx = mouseIndexFromContainer(event, lineChartBox, data.labels.length);
      updateLineFocus(idx);
    });

    lineChartBox.addEventListener('mouseleave', function () {
      updateLineFocus(state.currentIndex);
    });
  }

  if (barsChartBox) {
    barsChartBox.addEventListener('mousemove', function (event) {
      const data = chartData[state.currentRange];
      const idx = mouseIndexFromContainer(event, barsChartBox, data.labels.length);
      updateBarsFocus(idx);
    });

    barsChartBox.addEventListener('mouseleave', function () {
      updateBarsFocus(state.currentIndex);
    });
  }

  applyRange('daily');
  startLiveUpdates();
  refreshEnergySnapshot();
  window.setInterval(refreshEnergySnapshot, 5 * 60 * 1000);
});

document.addEventListener('DOMContentLoaded', function () {
  const alertsPage = document.getElementById('alerts-page');
  if (!alertsPage) {
    return;
  }

  const tabs = Array.from(document.querySelectorAll('.alerts-tab'));
  const filter = document.getElementById('alerts-filter');
  const cards = Array.from(document.querySelectorAll('.alert-card'));
  const detailBody = document.getElementById('alert-detail-body');
  const detailEmpty = document.getElementById('alert-detail-empty');

  let currentGroup = 'active';
  let currentFilter = 'all';

  function matchesFilter(card) {
    if (currentFilter === 'all') {
      return true;
    }
    return card.dataset.level === currentFilter;
  }

  function renderList() {
    cards.forEach(function (card) {
      const isVisible = card.dataset.group === currentGroup && matchesFilter(card);
      card.classList.toggle('is-hidden', !isVisible);
      card.classList.remove('active-item');
    });

    if (detailBody) {
      detailBody.classList.add('is-hidden');
    }
    if (detailEmpty) {
      detailEmpty.classList.remove('is-hidden');
      detailEmpty.innerHTML = '<div class=\"detail-empty-icon\">◉</div><p>Selecione um alerta para ver os detalhes</p>';
    }
  }

  function selectAlert(card) {
    cards.forEach(function (item) {
      item.classList.remove('active-item');
    });
    card.classList.add('active-item');

    if (detailBody) {
      detailBody.classList.remove('is-hidden');
      detailBody.innerHTML =
        '<p class=\"detail-title\">' + card.dataset.title + '</p>' +
        '<p class=\"detail-message\">' + card.dataset.message + '</p>' +
        '<div class=\"detail-meta\">' +
        '<span>Status: ' + card.dataset.status + '</span>' +
        '<span>Data: ' + card.dataset.time + '</span>' +
        '</div>';
    }
    if (detailEmpty) {
      detailEmpty.classList.add('is-hidden');
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (b) {
        b.classList.remove('active');
      });
      tab.classList.add('active');
      currentGroup = tab.dataset.alertTab;
      renderList();
    });
  });

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      if (!card.classList.contains('is-hidden')) {
        selectAlert(card);
      }
    });
  });

  if (filter) {
    filter.addEventListener('change', function () {
      currentFilter = filter.value;
      renderList();
    });
  }

  renderList();
});

document.addEventListener('DOMContentLoaded', function () {
  const maintenancePage = document.getElementById('maintenance-page');
  if (!maintenancePage) {
    return;
  }

  const buttons = Array.from(document.querySelectorAll('.done-btn'));
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const card = button.closest('[data-component]');
      if (!card) {
        return;
      }

      button.classList.add('is-done');
      button.textContent = 'Manutenção Concluída';

      const badge = card.querySelector('.chip');
      if (badge) {
        badge.classList.remove('warn');
        badge.classList.add('ok');
        badge.textContent = 'Concluído';
      }

      const delay = card.querySelector('em');
      if (delay) {
        delay.textContent = 'Atualizado agora';
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const page = document.getElementById('building-page');
  if (!page) {
    return;
  }

  const items = Array.from(document.querySelectorAll('[data-destination]'));
  const pie = document.getElementById('building-pie');
  const pieWrap = document.getElementById('building-pie-wrap');
  const pieTooltip = document.getElementById('building-pie-tooltip');
  const pieName = document.getElementById('building-pie-name');
  const pieValue = document.getElementById('building-pie-value');
  const legend = document.getElementById('building-legend');
  const excessValue = document.getElementById('excess-value');
  const distributedValue = document.getElementById('distributed-value');
  const availableValue = document.getElementById('available-value');
  const destinationsActive = document.getElementById('destinations-active');
  const unusedRatio = document.getElementById('unused-ratio');
  const monthTotal = document.getElementById('month-total');
  const monthSavings = document.getElementById('month-savings');
  const historyBars = document.getElementById('building-history-bars');
  const historyLabels = document.getElementById('building-history-labels');
  const historyBox = document.getElementById('building-history-box');
  const historyTooltip = document.getElementById('building-history-tooltip');
  const historyTime = document.getElementById('building-history-time');
  const historyValue = document.getElementById('building-history-value');

  const totalExcess = 6.8;
  const baseHistory = [0.8, 0.5, 1.2, 2.4, 3.1, 2.8, 3.5, 1.9];
  const historyLabelsList = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  let currentHistoryValues = [];
  let currentHistoryCenters = [];
  let historyIndex = 0;
  let currentPieSegments = [];
  let distributionAnimFrame = null;

  function collectActive() {
    return items
      .filter(function (item) {
        const checkbox = item.querySelector('input[type=\"checkbox\"]');
        return checkbox && checkbox.checked;
      })
      .map(function (item) {
        return {
          name: item.dataset.name,
          color: item.dataset.color,
          energy: parseFloat(item.dataset.energy || '0')
        };
      });
  }

  function renderLegend(active, distributed) {
    if (!legend) {
      return;
    }

    legend.innerHTML = '';
    active.forEach(function (entry) {
      const percent = distributed > 0 ? (entry.energy / distributed) * 100 : 0;
      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML =
        '<span class=\"legend-left\"><span class=\"legend-dot\" style=\"background:' + entry.color + '\"></span>' +
        entry.name + ': ' + percent.toFixed(0) + '%</span>' +
        '<span class=\"legend-value\">' + entry.energy.toFixed(1) + ' kWh</span>';
      legend.appendChild(row);
    });
  }

  function renderPie(active, distributed, revealProgress) {
    if (!pie) {
      return;
    }
    const reveal = revealProgress === undefined ? 1 : Math.max(0, Math.min(revealProgress, 1));
    if (!active.length || distributed <= 0) {
      pie.style.background = '#e5e7eb';
      currentPieSegments = [];
      return;
    }

    let cursor = 0;
    currentPieSegments = [];
    const parts = active.map(function (entry) {
      const percent = (entry.energy / distributed) * 100;
      const start = cursor;
      const visiblePercent = percent * reveal;
      cursor += visiblePercent;
      currentPieSegments.push({
        name: entry.name,
        energy: entry.energy,
        percent: visiblePercent,
        start: start,
        end: cursor
      });
      return entry.color + ' ' + start.toFixed(2) + '% ' + cursor.toFixed(2) + '%';
    });
    const remainderStart = cursor.toFixed(2);
    pie.style.background = 'conic-gradient(' + parts.join(',') + ', #e5e7eb ' + remainderStart + '% 100%)';
  }

  function updatePieTooltip(event) {
    if (!pie || !pieTooltip || !pieName || !pieValue || !currentPieSegments.length) {
      return;
    }

    const rect = pie.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = rect.width / 2;

    if (distance > radius) {
      pieTooltip.classList.add('is-hidden');
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
    const percentAngle = (angle / 360) * 100;
    const segment = currentPieSegments.find(function (seg) {
      return percentAngle >= seg.start && percentAngle < seg.end;
    });

    if (!segment) {
      pieTooltip.classList.add('is-hidden');
      return;
    }

    const wrapRect = pieWrap.getBoundingClientRect();
    pieTooltip.style.left = (event.clientX - wrapRect.left + 12).toFixed(1) + 'px';
    pieTooltip.style.top = (event.clientY - wrapRect.top - 14).toFixed(1) + 'px';
    pieTooltip.style.transform = 'none';
    pieName.textContent = segment.name + ': ' + segment.percent.toFixed(0) + '%';
    pieValue.textContent = segment.energy.toFixed(1) + ' kWh';
    pieTooltip.classList.remove('is-hidden');
  }

  function renderHistory(scaleFactor) {
    if (!historyBars || !historyLabels) {
      return;
    }

    const values = baseHistory.map(function (value) {
      return Math.max(0, value * scaleFactor);
    });
    currentHistoryValues = values.slice();

    const xMin = 40;
    const xMax = 940;
    const yMax = 230;
    const yMin = 30;
    const maxValue = 3.6;
    const step = (xMax - xMin) / values.length;
    const barWidth = Math.min(95, step * 0.8);

    historyBars.innerHTML = '';
    historyLabels.innerHTML = '';
    currentHistoryCenters = [];

    values.forEach(function (value, index) {
      const h = (value / maxValue) * (yMax - yMin);
      const x = xMin + index * step + (step - barWidth) / 2;
      const y = yMax - h;
      const center = x + barWidth / 2;
      currentHistoryCenters.push(center);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x.toFixed(1));
      rect.setAttribute('y', y.toFixed(1));
      rect.setAttribute('width', barWidth.toFixed(1));
      rect.setAttribute('height', h.toFixed(1));
      rect.setAttribute('rx', '7');
      rect.setAttribute('class', 'history-bar' + (index === historyIndex ? ' active' : ''));
      historyBars.appendChild(rect);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', center.toFixed(1));
      label.setAttribute('y', '245');
      label.setAttribute('class', 'history-label');
      label.textContent = historyLabelsList[index];
      historyLabels.appendChild(label);
    });

    updateHistoryFocus(historyIndex);
  }

  function updateHistoryFocus(index) {
    if (!currentHistoryValues.length) {
      return;
    }
    historyIndex = Math.max(0, Math.min(index, currentHistoryValues.length - 1));

    if (historyBars) {
      Array.from(historyBars.querySelectorAll('.history-bar')).forEach(function (bar, i) {
        bar.classList.toggle('active', i === historyIndex);
      });
    }

    const center = currentHistoryCenters[historyIndex];
    if (historyTooltip && historyTime && historyValue && center !== undefined) {
      historyTooltip.style.left = ((center / 960) * 100).toFixed(2) + '%';
      historyTime.textContent = historyLabelsList[historyIndex];
      historyValue.textContent = currentHistoryValues[historyIndex].toFixed(1) + ' kWh';
    }
  }

  function historyIndexFromCursor(event) {
    if (!historyBox || !currentHistoryValues.length) {
      return 0;
    }
    const rect = historyBox.getBoundingClientRect();
    const ratio = Math.max(0, Math.min((event.clientX - rect.left) / rect.width, 1));
    return Math.round(ratio * (currentHistoryValues.length - 1));
  }

  function paintDistribution(activeBase, targetDistributed, currentDistributed) {
    const safeCurrent = Math.max(0, currentDistributed);
    const available = Math.max(totalExcess - safeCurrent, 0);
    const unused = totalExcess > 0 ? (available / totalExcess) * 100 : 0;
    const factor = targetDistributed > 0 ? safeCurrent / targetDistributed : 0;

    const activeScaled = activeBase.map(function (entry) {
      return {
        name: entry.name,
        color: entry.color,
        energy: entry.energy * factor
      };
    });

    if (excessValue) { excessValue.textContent = totalExcess.toFixed(1) + ' kWh'; }
    if (distributedValue) { distributedValue.textContent = safeCurrent.toFixed(1) + ' kWh'; }
    if (availableValue) { availableValue.textContent = available.toFixed(1) + ' kWh'; }
    if (destinationsActive) { destinationsActive.textContent = activeBase.length + ' destinos ativos'; }
    if (unusedRatio) { unusedRatio.textContent = unused.toFixed(0) + '% não utilizado'; }

    const revealProgress = targetDistributed > 0 ? Math.max(0, Math.min(safeCurrent / targetDistributed, 1)) : 0;
    renderPie(activeBase, targetDistributed, revealProgress);
    renderLegend(activeScaled, safeCurrent);

    const scale = safeCurrent > 0 ? safeCurrent / 2.4 : 0.1;
    renderHistory(scale);

    const monthly = safeCurrent * 78.1;
    const savings = monthly * 0.152;
    if (monthTotal) { monthTotal.textContent = monthly.toFixed(1) + ' kWh'; }
    if (monthSavings) { monthSavings.textContent = '€' + savings.toFixed(2); }
  }

  function updateMetrics(animateOnLoad) {
    const active = collectActive();
    const targetDistributed = active.reduce(function (sum, entry) { return sum + entry.energy; }, 0);

    if (!animateOnLoad) {
      paintDistribution(active, targetDistributed, targetDistributed);
      return;
    }

    if (distributionAnimFrame) {
      cancelAnimationFrame(distributionAnimFrame);
    }

    const duration = 2200;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      const current = targetDistributed * eased;
      paintDistribution(active, targetDistributed, current);

      if (t < 1) {
        distributionAnimFrame = requestAnimationFrame(step);
      }
    }

    distributionAnimFrame = requestAnimationFrame(step);
  }

  items.forEach(function (item) {
    const checkbox = item.querySelector('input[type=\"checkbox\"]');
    if (!checkbox) {
      return;
    }
    checkbox.addEventListener('change', function () {
      item.classList.toggle('muted', !checkbox.checked);
      updateMetrics(false);
    });
  });

  if (historyBox) {
    historyBox.addEventListener('mousemove', function (event) {
      updateHistoryFocus(historyIndexFromCursor(event));
    });
  }

  if (pieWrap && pie) {
    pieWrap.addEventListener('mousemove', function (event) {
      updatePieTooltip(event);
    });
    pieWrap.addEventListener('mouseleave', function () {
      if (pieTooltip) {
        pieTooltip.classList.add('is-hidden');
        pieTooltip.style.left = '50%';
        pieTooltip.style.top = '6px';
        pieTooltip.style.transform = 'translateX(-50%)';
      }
    });
  }

  updateMetrics(true);
});

document.addEventListener('DOMContentLoaded', function () {
  const loginPage = document.getElementById('login-page');
  if (!loginPage) {
    return;
  }

  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('login-password');
  const toggleBtn = document.getElementById('toggle-password');

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', function () {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      toggleBtn.textContent = show ? '◎' : '◉';
      toggleBtn.setAttribute('aria-label', show ? 'Esconder palavra-passe' : 'Mostrar palavra-passe');
    });
  }

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const emailInput = document.getElementById('login-email');
      const submitButton = form.querySelector('button[type="submit"]');
      const passwordInputValue = passwordInput ? passwordInput.value : '';
      const emailValue = emailInput ? emailInput.value.trim().toLowerCase() : '';

      if (!window.SisaApi) {
        window.alert('Cliente da API indisponível.');
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'A entrar...';
      }

      try {
        const response = await window.SisaApi.post('/users/login', {
          email: emailValue,
          password: passwordInputValue
        });

        localStorage.setItem('sisaUser', JSON.stringify(response));
        localStorage.setItem('sisaLoginEmail', emailValue);

        if (response && response.token) {
          localStorage.setItem('sisaToken', response.token);
        }

        window.location.href = 'dashboard.html';
      } catch (error) {
        const message =
          error && error.payload && error.payload.message
            ? error.payload.message
            : 'Nao foi possivel iniciar sessao. Verifique os dados e tente novamente.';

        window.alert(message);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Entrar';
        }
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const registerPage = document.getElementById('register-page');
  if (!registerPage) {
    return;
  }

  const form = document.getElementById('register-form');
  const toggles = Array.from(document.querySelectorAll('.reg-toggle'));
  const password = document.getElementById('reg-password');
  const passwordConfirm = document.getElementById('reg-password-confirm');

  toggles.forEach(function (button) {
    button.addEventListener('click', function () {
      const targetId = button.getAttribute('data-target');
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) {
        return;
      }
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? '◎' : '◉';
    });
  });

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const firstName = document.getElementById('reg-first-name');
      const lastName = document.getElementById('reg-last-name');
      const email = document.getElementById('reg-email');
      const phone = document.getElementById('reg-phone');
      const building = document.getElementById('reg-building');

      if (!password || !passwordConfirm) {
        return;
      }

      if (password.value !== passwordConfirm.value) {
        window.alert('As palavras-passe não coincidem.');
        return;
      }

      if (!window.SisaApi) {
        window.alert('Cliente da API indisponível.');
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'A criar conta...';
      }

      try {
        await window.SisaApi.post('/users/create_user', {
          name: firstName ? firstName.value.trim() : '',
          lastname: lastName ? lastName.value.trim() : '',
          email: email ? email.value.trim().toLowerCase() : '',
          building: building ? building.value.trim() : '',
          password: password.value,
          phone: phone ? phone.value.trim() : ''
        });

        window.alert('Conta criada com sucesso.');
        window.location.href = 'login.html';
      } catch (error) {
        const message =
          error && error.payload && error.payload.message
            ? error.payload.message
            : 'Nao foi possivel criar a conta. Tente novamente.';

        window.alert(message);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Criar conta';
        }
      }
    });
  }
});
