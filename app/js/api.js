(function (window) {
  const DEFAULT_BASE_URL = 'https://sisa-api-58wf.onrender.com';
  const LOCAL_API_CANDIDATES = [
    'http://127.0.0.1:8000',
    'http://localhost:8000'
  ];

  let baseUrl = resolveBaseUrl();

  function isLocalFrontend() {
    const hostname = window.location && window.location.hostname ? window.location.hostname : '';
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }

  function resolveBaseUrl() {
    const metaTag = document.querySelector('meta[name="sisa-api-base-url"]');
    const metaValue = metaTag ? metaTag.getAttribute('content') : '';
    const localStorageValue = window.localStorage ? window.localStorage.getItem('sisaApiBaseUrl') : '';
    const explicitBaseUrl = window.SISA_API_BASE_URL || metaValue || localStorageValue;

    if (explicitBaseUrl) {
      return explicitBaseUrl.replace(/\/+$/, '');
    }

    if (isLocalFrontend()) {
      return LOCAL_API_CANDIDATES[0];
    }

    return DEFAULT_BASE_URL.replace(/\/+$/, '');
  }

  function buildUrl(path) {
    if (!path) {
      return baseUrl;
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalizedPath = path.charAt(0) === '/' ? path : '/' + path;
    return baseUrl + normalizedPath;
  }

  async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.indexOf('application/json') !== -1;
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = new Error('Falha ao consumir a API.');
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async function request(path, options) {
    const config = options || {};
    const headers = Object.assign(
      {
        Accept: 'application/json'
      },
      config.headers || {}
    );

    const fetchOptions = Object.assign({}, config, { headers: headers });
    const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

    if (hasBody && !isFormData && typeof fetchOptions.body !== 'string') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    async function tryFetch(url) {
      const response = await fetch(url, fetchOptions);
      return parseResponse(response);
    }

    const primaryUrl = buildUrl(path);

    try {
      return await tryFetch(primaryUrl);
    } catch (error) {
      if (!isLocalFrontend() || !baseUrl || LOCAL_API_CANDIDATES.indexOf(baseUrl) === -1) {
        throw error;
      }

      const fallbackUrl = baseUrl === LOCAL_API_CANDIDATES[0] ? LOCAL_API_CANDIDATES[1] : LOCAL_API_CANDIDATES[0];

      try {
        const payload = await tryFetch(fallbackUrl + (path.charAt(0) === '/' ? path : '/' + path));
        baseUrl = fallbackUrl;
        return payload;
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  const api = {
    getBaseUrl: function () {
      return baseUrl;
    },
    setBaseUrl: function (nextBaseUrl) {
      if (!nextBaseUrl) {
        return baseUrl;
      }

      baseUrl = String(nextBaseUrl).replace(/\/+$/, '');
      return baseUrl;
    },
    request: request,
    get: function (path, options) {
      return request(path, Object.assign({}, options, { method: 'GET' }));
    },
    post: function (path, body, options) {
      return request(path, Object.assign({}, options, { method: 'POST', body: body }));
    },
    put: function (path, body, options) {
      return request(path, Object.assign({}, options, { method: 'PUT', body: body }));
    },
    patch: function (path, body, options) {
      return request(path, Object.assign({}, options, { method: 'PATCH', body: body }));
    },
    delete: function (path, options) {
      return request(path, Object.assign({}, options, { method: 'DELETE' }));
    },
    // Alerts API
    getAlerts: function () {
      return this.get('/alerts/');
    },
    resolveAlert: function (alertId, payload) {
      return this.put('/alerts/' + alertId + '/resolve', payload);
    },
    getAlertsStatistics: function () {
      return this.get('/alerts/statistics');
    },
    sendElevatorStatus: function (floor, isMoving) {
      return this.post('/alerts/elevator-status', { floor: floor, is_moving: isMoving });
    },
    sendBatteryTelemetry: function (telemetry) {
      return this.post('/alerts/battery-telemetry', telemetry);
    }
  };

  window.SisaApi = api;
})(window);
