// background.js

/**
 * Initialize the extension by creating the context menu.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log("Scroll Position Marker Extension Installed.");

  // Create context menu item for "Mark It"
  chrome.contextMenus.create(
    {
      id: "mark-it",
      title: "Mark It",
      contexts: ["all"]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error creating context menu:", chrome.runtime.lastError);
      } else {
        console.log("Context menu item 'Mark It' created.");
      }
    }
  );
});

/**
 * Listen for context menu clicks.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "mark-it") {
    console.log("'Mark It' context menu clicked.");

    if (tab.id && tab.url.startsWith("http")) {
      // Execute a script to get the current scroll position
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: getScrollPosition
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error("Script injection failed:", chrome.runtime.lastError.message);
            createNotification("Error", "Failed to mark scroll position.");
            return;
          }

          if (
            injectionResults &&
            injectionResults[0] &&
            typeof injectionResults[0].result === "number"
          ) {
            const scrollY = injectionResults[0].result;
            const key = tab.url;

            // Save the scroll position in storage
            chrome.storage.local.set({ [key]: scrollY }, () => {
              if (chrome.runtime.lastError) {
                console.error("Error saving scroll position:", chrome.runtime.lastError);
                createNotification("Error", "Failed to save scroll position.");
              } else {
                console.log(`Scroll position (${scrollY}) saved for URL: ${key}`);
                createNotification("Success", "Scroll position saved!");
              }
            });
          } else {
            console.error("Unexpected result from injected script.");
            createNotification("Error", "Failed to retrieve scroll position.");
          }
        }
      );
    } else {
      createNotification("Error", "Cannot mark scroll position on this page.");
    }
  }
});

/**
 * Function to retrieve the current vertical scroll position.
 * This function is executed within the context of the webpage.
 * @returns {number} The current vertical scroll position.
 */
function getScrollPosition() {
  return window.scrollY;
}

/**
 * Function to create and display a notification.
 * @param {string} title - The title of the notification.
 * @param {string} message - The message body of the notification.
 */
function createNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: title,
    message: message
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error("Notification creation failed:", chrome.runtime.lastError);
    } else {
      console.log(`Notification (${notificationId}) created: ${title} - ${message}`);
    }
  });
}
