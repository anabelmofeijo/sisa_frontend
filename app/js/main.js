function formatKwh(value) {
  return value === null ? '0.000 kWh' : value.toFixed(3) + ' kWh';
}

function formatPlainNumber(value, maxFractionDigits) {
  const fixedValue = value.toFixed(maxFractionDigits);
  return fixedValue.replace(/\.?0+$/, '');
}

function formatJoules(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0 J';
  }

  return formatPlainNumber(value, 2) + ' J';
}

function formatKilojoules(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0 KJ';
  }

  return formatPlainNumber(value / 1000, 2) + ' KJ';
}

function formatKjValue(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0 KJ';
  }

  return formatPlainNumber(value, 2) + ' KJ';
}

function formatPower(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.000 W';
  }

  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(3) + ' kW';
  }

  return value.toFixed(3) + ' W';
}

function formatEnergyValue(value) {
  return value === null ? '0.000' : value.toFixed(3);
}

function pickTimestamp(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const timestampKeys = ['updated_at', 'updatedAt', 'created_at', 'createdAt', 'timestamp', 'date', 'measured_at'];

  for (let index = 0; index < timestampKeys.length; index += 1) {
    const rawValue = entry[timestampKeys[index]];
    if (!rawValue) {
      continue;
    }

    const parsedDate = new Date(rawValue);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null;
}

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
  const statusElement = document.getElementById('dashboard-elevator-status');

  if (!statusElement) {
    return;
  }

  function renderSystemStatus(isActive) {
    statusElement.innerHTML = '<span class="dot"></span>' + (isActive ? 'Em funcionamento' : 'Parado');
  }

  window.addEventListener('sisa:battery-activity', function (event) {
    renderSystemStatus(Boolean(event.detail && event.detail.isActive));
  });

  renderSystemStatus(false);
});

document.addEventListener('DOMContentLoaded', function () {
  const batteryCards = Array.from(document.querySelectorAll('[data-battery-card], [data-battery-panel]'));
  if (!batteryCards.length) {
    return;
  }

  const refreshIntervalMs = 10 * 1000;
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
      return '0' + suffix;
    }

    return value.toFixed(digits) + suffix;
  }

  function setBatteryAsUnavailable(element) {
    const statusElement = element.querySelector('[data-battery-status]');
    const percentElement = element.querySelector('[data-battery-percent]');
    const progressElement = element.querySelector('[data-battery-progress]');
    const healthValue = element.querySelector('[data-battery-health]');
    const healthWrap = element.querySelector('[data-battery-health-wrap]');
    const metaRow = element.querySelector('[data-battery-meta-row]');
    const temperatureValue = element.querySelector('[data-battery-temperature]');
    const voltageValue = element.querySelector('[data-battery-voltage]');
    const currentValue = element.querySelector('[data-battery-current]');
    const stateDot = element.querySelector('[data-battery-state-dot]');
    const chargeBox = element.querySelector('.charge-box');

    applyText(element, '[data-battery-status]', 'Sem dados');
    applyText(element, '[data-battery-percent]', '0%');
    applyText(element, '[data-battery-health]', '0%');
    applyText(element, '[data-battery-temperature]', '0%');
    applyText(element, '[data-battery-voltage]', '0.0 V');
    applyText(element, '[data-battery-current]', '0 A');

    if (progressElement) {
      progressElement.style.width = '0%';
    }

    updateClassList(statusElement, ['gray', 'dark'], 'gray');
    updateClassList(percentElement, ['green', 'yellow', 'orange'], null);
    updateClassList(healthValue, ['green', 'yellow', 'orange'], null);
    updateClassList(healthWrap, ['green', 'yellow', 'orange'], null);
    updateClassList(metaRow, ['green', 'yellow', 'orange'], null);
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
      currentUnit: ' A',
      status: status
    };
  }

  function applyCrossBatteryMapping(entries) {
    const batteryAEntry = entries.find(function (entry) {
      return entry && entry.state && entry.state.name === 'first_batery';
    });

    if (!batteryAEntry || !batteryAEntry.state) {
      return entries;
    }

    return entries.map(function (entry) {
      if (!entry || entry.config.name !== 'second_batery') {
        return entry;
      }

      const mappedCharge = clampPercent(batteryAEntry.state.temperature);
      const mappedVoltage = batteryAEntry.state.current;
      const nextState = entry.state || {
        name: entry.config.name,
        label: entry.config.label,
        health: batteryAEntry.state.health,
        current: 2,
        currentUnit: ' A',
        status: deriveStatus('', batteryAEntry.state.current)
      };

      return Object.assign({}, entry, {
        state: Object.assign({}, nextState, {
          charge: mappedCharge,
          voltage: mappedVoltage,
          temperature: batteryAEntry.state.temperature,
          status: deriveStatus(nextState.status, batteryAEntry.state.current)
        })
      });
    });
  }

  function hasBatteryTelemetry(state) {
    if (!state) {
      return false;
    }

    return [
      state.charge,
      state.voltage,
      state.current,
      state.temperature
    ].some(function (value) {
      return typeof value === 'number' && !isNaN(value);
    });
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
    const metaRow = element.querySelector('[data-battery-meta-row]');
    const temperatureValue = element.querySelector('[data-battery-temperature]');
    const voltageValue = element.querySelector('[data-battery-voltage]');
    const currentValue = element.querySelector('[data-battery-current]');
    const stateDot = element.querySelector('[data-battery-state-dot]');
    const chargeBox = element.querySelector('.charge-box');

    applyText(element, '[data-battery-status]', state.status);
    applyText(element, '[data-battery-percent]', Math.round(state.charge) + '%');
    applyText(element, '[data-battery-health]', state.health === null ? '0%' : Math.round(state.health) + '%');
    applyText(element, '[data-battery-temperature]', formatMetric(state.temperature, '%', 0));
    applyText(element, '[data-battery-voltage]', formatMetric(state.voltage, ' V', 1));
    applyText(element, '[data-battery-current]', '2 A');

    if (progressElement) {
      progressElement.style.width = state.charge.toFixed(1) + '%';
    }

    updateClassList(statusElement, ['gray', 'dark'], statusClasses.badge);
    updateClassList(percentElement, ['green', 'yellow', 'orange'], tone);
    updateClassList(healthValue, ['green', 'yellow', 'orange'], percentTone(state.health === null ? 0 : state.health));
    updateClassList(healthWrap, ['green', 'yellow', 'orange'], percentTone(state.health === null ? 0 : state.health));
    updateClassList(metaRow, ['green', 'yellow', 'orange'], tone);
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

  function resetBatterySummary() {
    const activeName = document.querySelector('[data-battery-active-name]');
    const activeStatus = document.querySelector('[data-battery-active-status]');
    const chargingName = document.querySelector('[data-battery-charging-name]');
    const chargingStatus = document.querySelector('[data-battery-charging-status]');

    if (activeName) {
      activeName.textContent = '0';
    }
    if (activeStatus) {
      activeStatus.textContent = '0';
    }
    if (chargingName) {
      chargingName.textContent = '0';
    }
    if (chargingStatus) {
      chargingStatus.textContent = '0% carregada';
    }
  }

  if (!window.SisaApi) {
    batteryConfigs.forEach(function (config) {
      const matchingCards = Array.from(
        document.querySelectorAll('[data-battery-card="' + config.name + '"], [data-battery-panel="' + config.name + '"]')
      );

      matchingCards.forEach(function (element) {
        setBatteryAsUnavailable(element);
      });
    });
    resetBatterySummary();
    return;
  }

  async function refreshBatteries() {
    try {
      const responses = await Promise.all(
        batteryConfigs.map(function (config) {
          return window.SisaApi.get('/batery/get_batteries_by_name/' + config.name);
        })
      );

      const normalizedStates = applyCrossBatteryMapping(responses.map(function (response, index) {
        return {
          config: batteryConfigs[index],
          state: normalizeBatteryState(batteryConfigs[index], response)
        };
      }));

      const states = normalizedStates
        .map(function (entry) {
          return entry.state;
        })
        .filter(Boolean);

      window.dispatchEvent(new CustomEvent('sisa:battery-activity', {
        detail: {
          isActive: states.some(hasBatteryTelemetry)
        }
      }));

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
      window.dispatchEvent(new CustomEvent('sisa:battery-activity', {
        detail: {
          isActive: false
        }
      }));

      batteryConfigs.forEach(function (config) {
        const matchingCards = Array.from(
          document.querySelectorAll('[data-battery-card="' + config.name + '"], [data-battery-panel="' + config.name + '"]')
        );

        matchingCards.forEach(function (element) {
          setBatteryAsUnavailable(element);
        });
      });
      resetBatterySummary();
      console.error('Falha ao atualizar as baterias.', error);
    }
  }

  refreshBatteries();
  window.setInterval(refreshBatteries, refreshIntervalMs);
});

document.addEventListener('DOMContentLoaded', function () {
  const sourceName = document.getElementById('dashboard-source-name');
  const sourceNote = document.getElementById('dashboard-source-note');
  const buildingValue = document.getElementById('dashboard-building-val');
  const buildingDestination = document.getElementById('dashboard-building-dest');
  const updateText = document.getElementById('dashboard-energy-update-text');

  if (!sourceName || !sourceNote || !buildingValue || !buildingDestination || !updateText) {
    return;
  }

  const refreshIntervalMs = 60 * 1000;

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

  function renderSnapshot(snapshot) {
    if (!snapshot) {
      sourceName.textContent = 'Fonte indisponível';
      sourceNote.textContent = '0% da energia atual';
      buildingValue.textContent = '0 KJ';
      buildingDestination.textContent = 'Não definido';
      updateText.textContent = 'Atualização automática a cada 60 segundos • Última atualização: 0';
      return;
    }

    const dominantSource = snapshot.origin.regeneration >= snapshot.origin.panel
      ? {
          name: 'Regeneração do elevador',
          share: snapshot.origin.regeneration
        }
      : {
          name: 'Painéis solares',
          share: snapshot.origin.panel
        };

    sourceName.textContent = dominantSource.name;
    sourceNote.textContent = dominantSource.share.toFixed(1) + '% da energia atual';
    buildingValue.textContent = formatKjValue(snapshot.consumed);
    buildingDestination.textContent = dominantSource.name;

    if (snapshot.timestamp) {
      const timeLabel = snapshot.timestamp.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      updateText.textContent = 'Atualização automática a cada 60 segundos • Última atualização: ' + timeLabel;
      return;
    }

    updateText.textContent = 'Atualização automática a cada 60 segundos • Última atualização: agora';
  }

  if (!window.SisaApi) {
    renderSnapshot(null);
    return;
  }

  async function refreshDashboardEnergy() {
    try {
      const response = await window.SisaApi.get('/energy/ist_energy');
      const list = extractEnergyList(response).filter(Boolean);

      if (!list.length) {
        renderSnapshot(null);
        return;
      }

      const latestEntry = list[list.length - 1];
      const energyOrigin = latestEntry.energy_origin || {};
      const panel = toNumber(energyOrigin.panel) || 0;
      const regeneration = toNumber(energyOrigin.regeneration) || 0;
      const totalOrigin = panel + regeneration;

      renderSnapshot({
        consumed: toNumber(latestEntry.energy_consumed),
        timestamp: pickTimestamp(latestEntry),
        origin: {
          panel: totalOrigin > 0 ? (panel / totalOrigin) * 100 : 0,
          regeneration: totalOrigin > 0 ? (regeneration / totalOrigin) * 100 : 0
        }
      });
    } catch (error) {
      console.error('Falha ao atualizar a energia da dashboard.', error);
      renderSnapshot(null);
    }
  }

  refreshDashboardEnergy();
  window.setInterval(refreshDashboardEnergy, refreshIntervalMs);
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
      stored: [0.9, 0.5, 1.9, 4.2, 5.1, 4.8, 6.1, 3.4],
      sourceReg: 58.2,
      sourceSolar: 41.8,
      building: [0.3, 0.3, 0.7, 1.6, 2.4, 1.4, 1.9, 1.0],
      focusIndex: 3
    },
    weekly: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom', 'Media'],
      generated: [4.1, 6.8, 7.5, 5.9, 6.4, 4.7, 3.8, 5.6],
      stored: [3.4, 5.1, 5.8, 4.7, 5.2, 4.2, 3.2, 4.5],
      sourceReg: 54.0,
      sourceSolar: 46.0,
      building: [1.2, 1.6, 1.9, 1.4, 1.7, 1.1, 0.9, 1.4],
      focusIndex: 2
    },
    monthly: {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      generated: [3.5, 4.4, 6.2, 7.9, 6.8, 7.3, 6.1, 5.2],
      stored: [2.8, 3.4, 4.7, 5.6, 5.0, 5.3, 4.5, 3.9],
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
    storedPoints: [],
    barCenters: [],
    barValues: [],
    labels: [],
    displayData: null,
    apiChartData: null,
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

  function scaleMax(values) {
    const maxValue = values.reduce(function (acc, value) {
      return Math.max(acc, value || 0);
    }, 0);

    if (maxValue <= 0) {
      return 1;
    }

    return maxValue < 1 ? maxValue * 1.25 : maxValue * 1.15;
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
      kpiGerada.textContent = formatJoules(state.energySnapshot.generated);
      kpiConsumida.textContent = formatKjValue(state.energySnapshot.consumed);
      kpiArmazenada.textContent = formatKjValue(state.energySnapshot.stored);
      return;
    }

    kpiGerada.textContent = '0 J';
    kpiConsumida.textContent = '0 KJ';
    kpiArmazenada.textContent = '0 KJ';
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
      barsTipValue.textContent = 'Energia para Edificio : ' + formatKjValue(state.barValues[safeIndex]);
    }
  }

  function updateLineFocus(index) {
    const safeIndex = clamp(index, 0, state.generatedPoints.length - 1);
    state.currentIndex = safeIndex;

    const gPoint = state.generatedPoints[safeIndex];
    const cPoint = state.storedPoints[safeIndex];
    const data = state.displayData || chartData[state.currentRange];

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
    tipGreen.textContent = 'Gerada : ' + formatEnergyValue(data.generated[safeIndex]);
    tipBlue.textContent = 'Armazenada : ' + formatEnergyValue(data.stored[safeIndex]);

  }

  function renderBars(labels, values, focusIdx, maxValue) {
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
      const h = (value / maxValue) * (yMax - yMin);
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
    const baseData = state.apiChartData && state.apiChartData[state.currentRange]
      ? state.apiChartData[state.currentRange]
      : chartData[state.currentRange];
    const data = state.energySnapshot === false
      ? {
          labels: baseData.labels.slice(),
          generated: baseData.labels.map(function () { return 0; }),
          stored: baseData.labels.map(function () { return 0; }),
          sourceReg: 0,
          sourceSolar: 0,
          building: baseData.labels.map(function () { return 0; }),
          focusIndex: baseData.focusIndex
        }
      : baseData;
    const initialFocus = focusIdx === undefined ? data.focusIndex : focusIdx;
    state.displayData = data;

    const lineMax = scaleMax(data.generated.concat(data.stored));
    const barMax = scaleMax(data.building);

    state.generatedPoints = toPoints(data.generated, lineMax);
    state.storedPoints = toPoints(data.stored, lineMax);

    chartLineGreen.setAttribute('d', linePath(state.generatedPoints));
    chartLineBlue.setAttribute('d', linePath(state.storedPoints));
    chartAreaGreen.setAttribute('d', areaPath(state.generatedPoints));
    chartAreaBlue.setAttribute('d', areaPath(state.storedPoints));

    if (state.energySnapshot) {
      sourceRegFill.style.width = '80%';
      sourceSolFill.style.width = '70%';
      sourceRegLabel.textContent = '80.0%';
      sourceSolLabel.textContent = '70.0%';
    } else if (state.energySnapshot === false) {
      sourceRegFill.style.width = '0%';
      sourceSolFill.style.width = '0%';
      sourceRegLabel.textContent = '0%';
      sourceSolLabel.textContent = '0%';
    } else {
      sourceRegFill.style.width = data.sourceReg.toFixed(1) + '%';
      sourceSolFill.style.width = data.sourceSolar.toFixed(1) + '%';
      sourceRegLabel.textContent = data.sourceReg.toFixed(1) + '%';
      sourceSolLabel.textContent = data.sourceSolar.toFixed(1) + '%';
    }

    updateKpis(data);
    renderBars(data.labels, data.building, initialFocus, barMax);
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
    const generatedRaw = toNumber(entry.energy_generated);
    const consumedRaw = toNumber(entry.energy_consumed);
    const storedRaw = toNumber(entry.energy_stored);
    const totalOrigin = panel + regeneration;

    return {
      generated: generatedRaw,
      consumed: consumedRaw,
      stored: storedRaw,
      timestamp: pickTimestamp(entry),
      origin: {
        panel: totalOrigin > 0 ? (panel / totalOrigin) * 100 : 0,
        regeneration: totalOrigin > 0 ? (regeneration / totalOrigin) * 100 : 0
      }
    };
  }

  function averageChunk(chunk) {
    if (!chunk.length) {
      return {
        generated: 0,
        consumed: 0,
        stored: 0,
        timestamp: null
      };
    }

    const totals = chunk.reduce(function (acc, entry) {
      acc.generated += entry.generated || 0;
      acc.consumed += entry.consumed || 0;
      acc.stored += entry.stored || 0;
      acc.timestamp = entry.timestamp || acc.timestamp;
      return acc;
    }, {
      generated: 0,
      consumed: 0,
      stored: 0,
      timestamp: null
    });

    return {
      generated: totals.generated / chunk.length,
      consumed: totals.consumed / chunk.length,
      stored: totals.stored / chunk.length,
      timestamp: totals.timestamp
    };
  }

  function buildBuckets(history, bucketCount, windowSize, fallbackPrefix) {
    const result = [];
    const maxLength = bucketCount * windowSize;
    const recentHistory = history.slice(-maxLength);

    for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
      const end = recentHistory.length - ((bucketCount - bucketIndex - 1) * windowSize);
      const start = Math.max(0, end - windowSize);
      const chunk = end > 0 ? recentHistory.slice(start, end) : [];
      result.push(averageChunk(chunk));
    }

    return {
      labels: result.map(function (entry, index) {
        if (entry.timestamp) {
          return entry.timestamp.toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        return fallbackPrefix + ' ' + (index + 1);
      }),
      generated: result.map(function (entry) { return entry.generated; }),
      stored: result.map(function (entry) { return entry.stored; }),
      sourceReg: history.length && history[history.length - 1].origin ? history[history.length - 1].origin.regeneration : 0,
      sourceSolar: history.length && history[history.length - 1].origin ? history[history.length - 1].origin.panel : 0,
      building: result.map(function (entry) { return entry.consumed; }),
      focusIndex: Math.max(result.length - 1, 0)
    };
  }

  function buildApiChartData(history) {
    if (!history.length) {
      return null;
    }

    return {
      daily: buildBuckets(history, 8, 1, 'R'),
      weekly: buildBuckets(history, 8, 4, 'B'),
      monthly: buildBuckets(history, 8, 8, 'S')
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
        state.apiChartData = null;
        renderCurrentRange(state.currentIndex);
        return;
      }

      const normalizedHistory = list.map(normalizeEnergySnapshot).filter(Boolean);
      state.apiChartData = buildApiChartData(normalizedHistory);
      state.energySnapshot = normalizedHistory[normalizedHistory.length - 1];
      renderCurrentRange(state.currentIndex);
    } catch (error) {
      state.energySnapshot = false;
      state.apiChartData = null;
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

  if (!window.SisaApi) {
    state.energySnapshot = false;
    applyRange('daily');
    return;
  }

  applyRange('daily');
  refreshEnergySnapshot();
  window.setInterval(refreshEnergySnapshot, 60 * 1000);
});

document.addEventListener('DOMContentLoaded', function () {
  const alertsPage = document.getElementById('alerts-page');
  if (!alertsPage) {
    return;
  }

  const tabs = Array.from(document.querySelectorAll('.alerts-tab'));
  const filter = document.getElementById('alerts-filter');
  const alertsList = document.getElementById('alerts-list');
  const detailBody = document.getElementById('alert-detail-body');
  const detailEmpty = document.getElementById('alert-detail-empty');

  let currentGroup = 'active';
  let currentFilter = 'all';
  let alertsData = [];

  function setAlertStatistics(counts) {
    const criticalElement = document.getElementById('critical-count');
    const mediumElement = document.getElementById('medium-count');
    const lowElement = document.getElementById('low-count');
    const resolvedElement = document.getElementById('resolved-count');

    if (criticalElement) {
      criticalElement.textContent = String(counts.critical || 0);
    }
    if (mediumElement) {
      mediumElement.textContent = String(counts.medium || 0);
    }
    if (lowElement) {
      lowElement.textContent = String(counts.low || 0);
    }
    if (resolvedElement) {
      resolvedElement.textContent = String(counts.resolved || 0);
    }
  }

  function getLevelClass(level) {
    switch (level) {
      case 'critical': return 'critical';
      case 'warning': return 'medium';
      case 'info': return 'low';
      default: return 'low';
    }
  }

  function getLevelText(level) {
    switch (level) {
      case 'critical': return 'Alto';
      case 'warning': return 'Médio';
      case 'info': return 'Baixo';
      default: return 'Baixo';
    }
  }

  function getGroup(alert) {
    return alert.status === 'resolved' ? 'history' : 'active';
  }

  function matchesFilter(alert) {
    if (currentFilter === 'all') {
      return true;
    }
    if (currentFilter === 'resolved') {
      return alert.status === 'resolved';
    }
    if (currentFilter === 'critical') {
      return alert.level === 'critical';
    }
    if (currentFilter === 'medium') {
      return alert.level === 'warning';
    }
    if (currentFilter === 'low') {
      return alert.level === 'info';
    }
    return false;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT');
  }

  function renderAlert(alert) {
    const levelClass = getLevelClass(alert.level);
    const levelText = getLevelText(alert.level);
    const group = getGroup(alert);
    const isVisible = group === currentGroup && matchesFilter(alert);
    const isResolved = alert.status === 'resolved';

    const alertIdValue = alert.id || alert._id || alert.alert_id || alertId || '';

    const title =
      (alert.title && String(alert.title).trim()) ||
      (alert.name && String(alert.name).trim()) ||
      (alert.subject && String(alert.subject).trim()) ||
      (alert.message && String(alert.message).trim()) ||
      'Alerta sem título';

    const description =
      (alert.description && String(alert.description).trim()) ||
      (alert.body && String(alert.body).trim()) ||
      (alert.detail && String(alert.detail).trim()) ||
      (alert.message && String(alert.message).trim()) ||
      'Sem descrição disponível';

    const createdAt = alert.created_at || alert.updated_at || alert.timestamp || new Date().toISOString();

    return `
      <article class="alert-card ${levelClass} ${isVisible ? '' : 'is-hidden'}" data-group="${group}" data-level="${alert.level}" data-title="${title}" data-message="${description}" data-time="${formatDate(createdAt)}" data-status="${levelText}" data-id="${alertIdValue}">
        <small class="alert-id">ID: ${alertIdValue}</small>
        <h3>${title} <span class="alert-badge ${levelClass}">${levelText}</span></h3>
        <p>${description}</p>
        <small>${formatDate(createdAt)}</small>
        ${!isResolved ? '<button class="resolve-btn" data-alert-id="' + alertIdValue + '">Resolver</button>' : ''}
      </article>
    `;
  }

  function renderList() {
    const html = alertsData.map(renderAlert).join('');
    alertsList.innerHTML = html;

    // Re-attach event listeners
    const cards = Array.from(alertsList.querySelectorAll('.alert-card'));
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (!card.classList.contains('is-hidden')) {
          selectAlert(card);
        }
      });
    });

    const resolveButtons = Array.from(alertsList.querySelectorAll('.resolve-btn'));
    resolveButtons.forEach(function (button) {
      button.addEventListener('click', function (e) {
        e.stopPropagation();
        const alertId = button.dataset.alertId;
        resolveAlert(alertId);
      });
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
    const cards = Array.from(alertsList.querySelectorAll('.alert-card'));
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

  function loadAlerts() {
    if (!window.SisaApi) {
      console.error('API not available');
      alertsData = [];
      renderList();
      updateTabCounts();
      return;
    }

    window.SisaApi.getAlerts()
      .then(function (response) {
        let items = [];

        if (Array.isArray(response)) {
          items = response;
        } else if (response) {
          items = response.data || response.alerts || response.items || response.records || [];
          if (!Array.isArray(items)) {
            items = [];
          }
        }

        console.log('Alertas carregados:', items.length, 'items');
        alertsData = items;
        renderList();
        updateTabCounts();
      })
      .catch(function (error) {
        console.error('Failed to load alerts:', error);
        alertsData = [];
        renderList();
        updateTabCounts();
      });
  }

  function loadStatistics() {
    if (!window.SisaApi) {
      setAlertStatistics({ critical: 0, medium: 0, low: 0, resolved: 0 });
      return;
    }

    window.SisaApi.getAlertsStatistics()
      .then(function (stats) {
        console.log('Estatísticas recebidas:', stats);

        const criticalCount = stats.critical_count ?? stats.critical ?? stats.criticalCount ?? stats.high ?? 0;
        const mediumCount = stats.warning_count ?? stats.warning ?? stats.medium ?? stats.mediumCount ?? stats.medium_count ?? 0;
        const lowCount = stats.info_count ?? stats.info ?? stats.low ?? stats.lowCount ?? stats.info ?? 0;
        const resolvedCount = stats.resolved_count ?? stats.resolved ?? stats.resolvedCount ?? stats.closed ?? 0;

        console.log('Contadores: críticos=' + criticalCount + ', médios=' + mediumCount + ', baixos=' + lowCount + ', resolvidos=' + resolvedCount);

        setAlertStatistics({
          critical: criticalCount,
          medium: mediumCount,
          low: lowCount,
          resolved: resolvedCount
        });
      })
      .catch(function (error) {
        setAlertStatistics({ critical: 0, medium: 0, low: 0, resolved: 0 });
        console.error('Failed to load statistics:', error);
      });
  }

  function resolveAlert(alertId) {
    if (!window.SisaApi) {
      return;
    }

    const primaryPayload = { id: Number(alertId), status: 'active' };

    console.log('Tentando resolver alerta ' + alertId + ' com payload:', primaryPayload);

    window.SisaApi.resolveAlert(alertId, primaryPayload)
      .then(function (response) {
        console.log('Alerta resolvido com sucesso:', response);
      })
      .catch(function (error) {
        console.error('Erro ao resolver alerta:', error);
      })
      .finally(function () {
        // Atualiza sempre, independente de sucesso ou erro
        console.log('Recarregando alertas e estatísticas...');
        loadAlerts();
        loadStatistics();
      });
  }

  function updateTabCounts() {
    const activeCount = alertsData.filter(a => a.status !== 'resolved').length;
    const historyCount = alertsData.filter(a => a.status === 'resolved').length;

    const activeTab = tabs.find(t => t.dataset.alertTab === 'active');
    const historyTab = tabs.find(t => t.dataset.alertTab === 'history');

    if (activeTab) {
      activeTab.textContent = `Ativos (${activeCount})`;
    }
    if (historyTab) {
      historyTab.textContent = `Histórico (${historyCount})`;
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

  if (filter) {
    filter.addEventListener('change', function () {
      currentFilter = filter.value;
      renderList();
    });
  }

  // Load data on page load
  loadAlerts();
  loadStatistics();

  // Keep alerts and statistics fresh in near-real time
  const refreshIntervalMs = 10000;
  const refreshTimer = window.setInterval(function () {
    loadAlerts();
    loadStatistics();
  }, refreshIntervalMs);

  // Clean up timer when leaving the page (not always needed in SPA but safe)
  window.addEventListener('beforeunload', function () {
    window.clearInterval(refreshTimer);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const maintenancePage = document.getElementById('maintenance-page');
  if (!maintenancePage) {
    return;
  }

  const componentsList = document.getElementById('maintenance-components-list');
  const emptyState = document.getElementById('maintenance-empty-state');
  const hoursElement = document.getElementById('maintenance-hours');
  const tripsElement = document.getElementById('maintenance-trips');
  const lastDateElement = document.getElementById('maintenance-last-date');
  const nextDateElement = document.getElementById('maintenance-next-date');
  const lastCompletedStorageKey = 'sisaMaintenanceLastCompletedAt';

  if (!componentsList) {
    return;
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

  function formatInteger(value) {
    const safeValue = toNumber(value) || 0;
    return safeValue.toLocaleString('pt-PT');
  }

  function formatDate(value) {
    if (!value) {
      return '--';
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return '--';
    }

    return parsed.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function statusMeta(item) {
    const status = item && item.status ? String(item.status).toLowerCase() : '';
    const isCompleted = Boolean(item && item.completed_at);
    const isOverdue = Boolean(item && item.is_overdue);

    if (isCompleted) {
      return { card: 'ok', chip: 'ok', label: 'Concluído', note: 'Atualizado' };
    }

    if (status === 'critical' || isOverdue) {
      return { card: 'warn', chip: 'warn', label: 'Atenção', note: 'Atrasada' };
    }

    if (status === 'warning') {
      return { card: 'warn', chip: 'warn', label: 'Atenção', note: 'Agendada' };
    }

    return { card: 'ok', chip: 'ok', label: 'Ótimo', note: 'Agendada' };
  }

  function componentTitle(item) {
    const notes = item && item.notes ? String(item.notes).trim() : '';
    if (notes && notes.toLowerCase() !== 'concluída pelo técnico' && notes.toLowerCase() !== 'concluida pelo tecnico') {
      return notes;
    }

    return 'Componente #' + item.component_id;
  }

  function reliabilityValue(item) {
    const value = toNumber(item && item.reliability_percent);
    if (value === null) {
      return 0;
    }

    return Math.max(0, Math.min(100, value));
  }

  function renderStats(items) {
    const totalHours = items.reduce(function (acc, item) {
      return acc + (toNumber(item.operating_hours) || 0);
    }, 0);

    const totalTrips = items.reduce(function (acc, item) {
      return acc + (toNumber(item.total_trips) || 0);
    }, 0);

    const lastDates = items
      .map(function (item) { return item.last_maintenance_date; })
      .filter(Boolean)
      .map(function (value) { return new Date(value); })
      .filter(function (value) { return !isNaN(value.getTime()); });
    const storedLastCompleted = localStorage.getItem(lastCompletedStorageKey);
    if (storedLastCompleted) {
      const storedDate = new Date(storedLastCompleted);
      if (!isNaN(storedDate.getTime())) {
        lastDates.push(storedDate);
      }
    }

    const nextDates = items
      .map(function (item) { return item.next_maintenance_date || item.scheduled_date; })
      .filter(Boolean)
      .map(function (value) { return new Date(value); })
      .filter(function (value) { return !isNaN(value.getTime()); });

    hoursElement.textContent = formatInteger(totalHours);
    tripsElement.textContent = formatInteger(totalTrips);
    lastDateElement.textContent = lastDates.length ? formatDate(new Date(Math.max.apply(null, lastDates))) : '--';
    nextDateElement.textContent = nextDates.length ? formatDate(new Date(Math.min.apply(null, nextDates))) : '--';
  }

  function renderComponents(items) {
    componentsList.innerHTML = '';

    if (!items.length) {
      if (emptyState) {
        emptyState.style.display = 'block';
      }
      renderStats([]);
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    renderStats(items);

    items.forEach(function (item) {
      const meta = statusMeta(item);
      const reliability = reliabilityValue(item);
      const article = document.createElement('article');
      article.className = 'component-card ' + meta.card;
      article.setAttribute('data-component', '');
      article.setAttribute('data-maintenance-id', String(item.id));

      article.innerHTML =
        '<header>' +
          '<div>' +
            '<h3>' + componentTitle(item) + '</h3>' +
            '<p>' + formatInteger(item.operating_hours) + ' horas de operação</p>' +
          '</div>' +
          '<span class="chip ' + meta.chip + '">' + meta.label + '</span>' +
        '</header>' +
        '<div class="component-grid">' +
          '<div class="mini-info">' +
            '<span>Última Manutenção</span>' +
            '<strong>' + formatDate(item.last_maintenance_date) + '</strong>' +
          '</div>' +
          '<div class="mini-info">' +
            '<span>Próxima Manutenção</span>' +
            '<strong>' + formatDate(item.next_maintenance_date || item.scheduled_date) + '</strong>' +
            '<em>' + meta.note + '</em>' +
          '</div>' +
          '<div class="mini-info progress-box">' +
            '<span>Confiabilidade</span>' +
            '<div class="progress"><div class="bar" style="width:' + reliability.toFixed(1) + '%"></div></div>' +
          '</div>' +
        '</div>' +
        '<button class="done-btn" type="button">Marcar Manutenção Concluída</button>';

      componentsList.appendChild(article);
    });
  }

  function normalizeMaintenanceResponse(response) {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    if (response && Array.isArray(response.components)) {
      return response.components;
    }

    if (response && Array.isArray(response.items)) {
      return response.items;
    }

    return [];
  }

  async function loadMaintenance() {
    try {
      const response = await window.SisaApi.get('/maintenance/components');
      const items = normalizeMaintenanceResponse(response);

      renderComponents(items);
    } catch (error) {
      componentsList.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.textContent = 'Não foi possível carregar os dados de manutenção.';
      }
      renderStats([]);
      if (lastDateElement) {
        lastDateElement.textContent = '0';
      }
      if (nextDateElement) {
        nextDateElement.textContent = '0';
      }
      console.error('Erro ao carregar manutenção:', error);
    }
  }

  if (!window.SisaApi) {
    componentsList.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.textContent = 'Não foi possível carregar os dados de manutenção.';
    }
    renderStats([]);
    if (lastDateElement) {
      lastDateElement.textContent = '0';
    }
    if (nextDateElement) {
      nextDateElement.textContent = '0';
    }
    return;
  }

  componentsList.addEventListener('click', async function (event) {
    const button = event.target.closest('.done-btn');
    if (!button) {
      return;
    }

    const card = button.closest('[data-maintenance-id]');
    if (!card) {
      return;
    }

    const maintenanceId = card.getAttribute('data-maintenance-id');
    if (!maintenanceId) {
      return;
    }

    button.disabled = true;
    button.textContent = 'A concluir...';

    try {
      const completed = await window.SisaApi.post('/maintenance/components/' + maintenanceId + '/complete', {
        completed_at: new Date().toISOString()
      });

      if (completed && completed.completed_at) {
        localStorage.setItem(lastCompletedStorageKey, completed.completed_at);
      }

      await loadMaintenance();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Marcar Manutenção Concluída';
      window.alert('Não foi possível concluir a manutenção.');
    }
  });

  loadMaintenance();
  window.setInterval(loadMaintenance, 5 * 60 * 1000);
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
