var apiKey = "apikey firebase";
var projectId = "projectID";
var collection = "collection";

function main1() {
  tt('acc', 'mk');
}

function main2() {
  tt('acc', 'mk');
}

function main3() {
  tt('acc', 'mk');
}

function main4() {
  tt('cacc', 'mk');
}

function get_auth(email) {
  try {
    var url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${email}?key=${apiKey}`;
    var response = UrlFetchApp.fetch(url);
    var data = JSON.parse(response.getContentText());
    return data.fields.auth.stringValue;
  } catch (error) {
    Logger.log(`Error fetching auth for ${email}: ${error.message}`);
    return null;
  }
}

function edit_auth(email, auth) {
  try {
    var data = {
      fields: {
        auth: { stringValue: auth }
      }
    };
    var options = {
      method: "patch",
      contentType: "application/json",
      payload: JSON.stringify(data)
    };
    var url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${email}?key=${apiKey}`;
    
    UrlFetchApp.fetch(url, options);
    
    if (get_auth(email) === auth) {
      Logger.log(`Auth updated successfully for ${email}`);
    } else {
      Logger.log(`Failed to update auth for ${email}`);
    }
  } catch (error) {
    Logger.log(`Error editing auth for ${email}: ${error.message}`);
  }
}

function tt(email, password = '') {
  try {
    while (true) {
      var authToken = get_auth(email);
      if (!authToken) {
        Logger.log(`Auth token not found for ${email}, attempting to log in...`);
        authToken = login(email, password);
        if (!authToken) {
          Logger.log(`Login failed for ${email}`);
          return;
        }
        edit_auth(email, authToken);
      }

      var headers = {
        'Authorization': 'Bearer ' + authToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      };

      var userResponse = g('https://api.kinghub.io/api/v1/users', headers);
      if (userResponse && userResponse.status === 'success') {
        Logger.log(`User authenticated successfully for ${email}`);
        
        // Nhận phần thưởng
        var claimResponse = g('https://api.kinghub.io/api/v1/user-mining/claim', headers);
        var miningInfo = g('https://api.kinghub.io/api/v1/user-mining/info', headers);
        
        Logger.log(`Nhận: ${Math.floor(claimResponse.data)}, Tổng: ${Math.floor(miningInfo.data.point)}`);
        break;
      } else {
        Logger.log(`Re-authenticating for ${email}...`);
        authToken = login(email, password);
        edit_auth(email, authToken);
      }
    }
  } catch (error) {
    Logger.log(`Error in tt for ${email}: ${error.message}`);
  }
}

function login(email, password) {
  try {
    var payload = {
      email: email,
      password: password,
      code: ''
    };
    var response = UrlFetchApp.fetch('https://api.kinghub.io/api/v1/auth/login', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    var data = JSON.parse(response.getContentText());
    return data.data.accessToken;
  } catch (error) {
    Logger.log(`Login failed for ${email}: ${error.message}`);
    return null;
  }
}

function g(url, headers) {
  try {
    var response = UrlFetchApp.fetch(url, { method: 'get', headers: headers, muteHttpExceptions: true });
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log(`Error fetching ${url}: ${error.message}`);
    return null;
  }
}
