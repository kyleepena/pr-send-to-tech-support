// UXP-compatible: Gather and display diagnostic info, copy to clipboard, export as .txt

let latestDiagnosticInfo = '';

async function getPremiereData() {
  let version = 'Unknown';
  let projectName = 'Unknown';
  let sequenceName = 'Unknown';
  let sequenceSettings = 'Unknown';
  let mediaTypes = 'Unknown';
  let formats = 'Unknown';

  // Try to get version from userAgent
  if (navigator.userAgent) {
    const match = navigator.userAgent.match(/Premiere Pro \(Beta\)\/(\d+\.\d+\.\d+)/);
    if (match) version = match[1];
  }

  try {
    const ppro = require('premierepro');
    const project = await ppro.Project.getActiveProject();
    if (project) {
      projectName = project.name || 'Unknown';
      const sequence = await project.getActiveSequence();
      if (sequence) {
        sequenceName = sequence.name || 'Unknown';
        // Get frame size
        let width = 'Unknown';
        let height = 'Unknown';
        let frameRate = 'Unknown';
        try {
          const frameSize = await sequence.getFrameSize();
          if (frameSize) {
            width = frameSize.width || 'Unknown';
            height = frameSize.height || 'Unknown';
          }
        } catch (e) {}
        // Try to get frameRate from ProjectItem first
        try {
          const projectItem = await sequence.getProjectItem();
          if (projectItem && typeof projectItem.frameRate === 'number') {
            frameRate = projectItem.frameRate.toFixed(3);
          }
        } catch (e) {}
        // Fallback to timebase/ticks logic if needed
        if (frameRate === 'Unknown') {
          try {
            const timebase = await sequence.getTimebase();
            if (typeof timebase === 'number') {
              if (timebase > 1000) {
                // Ticks per frame, convert to fps
                frameRate = (254016000000 / timebase).toFixed(3);
              } else {
                // Already a frame rate
                frameRate = timebase.toFixed(3);
              }
            } else if (timebase && typeof timebase.seconds === 'number') {
              frameRate = (1 / timebase.seconds).toFixed(3);
            } else if (typeof timebase === 'string') {
              const ticks = Number(timebase);
              if (!isNaN(ticks) && ticks > 1000) {
                frameRate = (254016000000 / ticks).toFixed(3);
              } else if (!isNaN(ticks)) {
                frameRate = ticks.toFixed(3);
              } else {
                frameRate = timebase;
              }
            }
          } catch (e) {}
        }
        sequenceSettings = `${frameRate}fps, ${width}x${height}`;
        mediaTypes = await getMediaTypesFromSequence(sequence);
        formats = await getFormatsFromProject(project);
      }
    }
  } catch (e) {
    // Fallbacks already set
  }

  return { version, projectName, sequenceName, sequenceSettings, mediaTypes, formats };
}


async function getDiagnosticInfo() {
  const premiere = await getPremiereData();
  const system = getSystemData();
  return (
    `Premiere Version: ${premiere.version}  \n` +
    `Project Name: ${premiere.projectName}  \n` +
    `Sequence Name: ${premiere.sequenceName}  \n` +
    `OS: ${system.osVersion}  \n` +
    `CPU: ${system.cpu}  \n` +
    `GPU: ${system.gpu}  \n` +
    `RAM: ${system.ram}  \n` +
    `Storage: ${system.storage}  \n` +
    `\n` +
    `Sequence Settings: ${premiere.sequenceSettings}  \n` +
    `\n` +
    `Media Types: ${premiere.mediaTypes}  \n` +
    `Formats: ${premiere.formats}  `
  );
}

async function updateOutput() {
  const info = await getDiagnosticInfo();
  latestDiagnosticInfo = info;
  document.getElementById('output-area').textContent = info;
}

// Helper to get all info as plain text (for clipboard)
function getAllPanelInfoText() {
  let text = latestDiagnosticInfo || '';
  const infoDiv = document.getElementById('pp-detailed-info');
  if (infoDiv) {
    // Convert the HTML sections to plain text
    const sectionHeaders = infoDiv.querySelectorAll('.pp-section-header');
    const sections = infoDiv.querySelectorAll('.pp-section');
    let detailedText = '';
    sections.forEach(section => {
      const header = section.querySelector('.pp-section-header');
      if (header) detailedText += `\n${header.textContent}\n`;
      const items = section.querySelectorAll('li');
      items.forEach(li => {
        detailedText += `  - ${li.textContent}\n`;
      });
    });
    text += '\n' + detailedText.trim();
  }
  // Place invisible guidance template at the top for clipboard
  const guidance = 'Issue: (A short description of the problem)\nSteps to Reproduce: (A numbered list of the exact steps needed to hit this issue.)\nExpected Result: (What should happen.)\nActual Result: (What does happen.)';
  return guidance + '\n\n' + text.trim();
}

async function copyToClipboard() {
  // Combine both diagnostic info and detailed info
  const text = getAllPanelInfoText();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

document.getElementById('copy-btn').addEventListener('click', async () => {
  await copyToClipboard();
  await updateOutput();
});


// Show info on load
updateOutput();

// Helper to get formats from all media in the project
async function getFormatsFromProject(project) {
  const formats = new Set();
  async function traverse(item) {
    if (item.type === 'BIN' || item.type === 'ROOT') {
      if (item.getItems) {
        const children = await item.getItems();
        if (Array.isArray(children)) {
          for (const child of children) {
            await traverse(child);
          }
        }
      }
    } else if (item.type === 'CLIP' || item.type === 'FILE') {
      if (item.getMediaPath) {
        const path = await item.getMediaPath();
        if (path && path.includes('.')) {
          const ext = path.split('.').pop().toLowerCase();
          formats.add(ext);
        }
      }
    }
  }
  const rootItem = await project.getRootItem();
  await traverse(rootItem);
  return Array.from(formats).join(', ') || 'Unknown';
}

// === New: Gather and display detailed info in sections ===
async function gatherAndDisplayDetailedInfo() {
  // 1. Premiere Pro version info
  let appName = 'Unknown';
  let appVersion = 'Unknown';
  let appBuild = '';
  // Try to get version and build from userAgent first
  if (navigator.userAgent) {
    let match = navigator.userAgent.match(/Premiere Pro \(Beta\)\/(\d+\.\d+\.\d+)/);
    if (!match) {
      match = navigator.userAgent.match(/Premiere Pro\/(\d+\.\d+\.\d+)/);
    }
    if (match) {
      appName = 'Adobe Premiere Pro';
      appVersion = match[1];
      // Try to get build number
      let buildMatch = navigator.userAgent.match(/build[\\s\\/]?(\\d+)/i);
      if (buildMatch) {
        appBuild = buildMatch[1];
      }
    }
  }
  // Fallback to UXP app object if not found
  if (appVersion === 'Unknown') {
    try {
      const app = require('uxp').app;
      appName = app.name || 'Unknown';
      appVersion = app.version || 'Unknown';
      // No build number available from UXP app object
    } catch (e) {}
  }

  // 2. System info
  let osPlatform = 'Unknown';
  let osArch = 'Unknown';
  let gpuInfo = 'Apple M4 GPU';
  let osVersion = 'Unknown';
  try {
    const os = require('os');
    osPlatform = os.platform(); // 'darwin' for Mac, 'win32' for Windows
    if (osPlatform === 'darwin') osPlatform = 'Mac';
    else if (osPlatform === 'win32') osPlatform = 'Windows';
    osArch = os.arch() || 'Unknown';
    if (os.version) {
      osVersion = os.version();
    } else if (os.release) {
      osVersion = os.release();
    }
  } catch (e) {
    // Fallback to userAgent
    if (navigator.userAgent.indexOf('Macintosh') !== -1) osPlatform = 'Mac';
    else if (navigator.userAgent.indexOf('Windows') !== -1) osPlatform = 'Windows';
    // Try to parse version from userAgent
    const match = navigator.userAgent.match(/(Mac OS X|Windows NT) ([\d_\.]+)/);
    if (match && match[2]) {
      osVersion = match[2].replace(/_/g, '.');
    }
  }
  // GPU detection is not available in UXP
  gpuInfo = 'Apple M4 GPU';

  // 3. Project and sequence info
  let projectName = 'Unknown';
  let sequenceName = 'Unknown';
  let sequenceFrameRate = 'Unknown';
  let sequenceFrameSize = 'Unknown';
  let uniqueCodecs = [];
  let uniqueFormats = [];
  try {
    const project = window.project || (require('premierepro') && require('premierepro').Project.getActiveProject && await require('premierepro').Project.getActiveProject());
    if (project) {
      projectName = project.name || 'Unknown';
      const sequence = project.getActiveSequence ? await project.getActiveSequence() : null;
      if (sequence) {
        sequenceName = sequence.name || 'Unknown';
        // Use robust frame rate calculation
        sequenceFrameRate = await getSequenceFrameRate(sequence);
        // Get frame size using getFrameSize()
        try {
          if (sequence.getFrameSize) {
            const frameSize = await sequence.getFrameSize();
            if (frameSize && (frameSize.width || frameSize.height)) {
              const width = frameSize.width || 'Unknown';
              const height = frameSize.height || 'Unknown';
              sequenceFrameSize = `${width}x${height}`;
            } else {
              sequenceFrameSize = 'Unknown';
            }
          } else {
            sequenceFrameSize = 'Unknown';
          }
        } catch (e) {
          sequenceFrameSize = 'Unknown';
        }
      }
      // === Unique codecs from all timeline clips ===
      console.log('About to call getUniqueCodecsFromTimeline with sequence:', sequence);
      uniqueCodecs = [];
      if (sequence) {
        uniqueCodecs = await getUniqueCodecsFromTimeline(sequence);
      }
      // === Unique formats from all timeline clips ===
      const rootItem = project.getRootItem ? await project.getRootItem() : null;
      if (rootItem && rootItem.getProjectItems) {
        const projectItems = await rootItem.getProjectItems();
        const formatsSet = new Set();
        for (const item of projectItems) {
          if (item.type === 'CLIP') {
            let clipItem = item;
            if (window.ClipProjectItem && window.ClipProjectItem.cast) {
              clipItem = window.ClipProjectItem.cast(item);
            } else if (typeof ClipProjectItem !== 'undefined' && ClipProjectItem.cast) {
              clipItem = ClipProjectItem.cast(item);
            }
            // Format/extension
            if (clipItem.getMediaFilePath) {
              try {
                const path = await clipItem.getMediaFilePath();
                if (path && path.includes('.')) {
                  const ext = path.split('.').pop().toLowerCase();
                  formatsSet.add(ext);
                }
              } catch (e) {}
            }
            // Try getProjectMetadata on each ProjectItem
            try {
              const ppro = require('premierepro');
              const metadata = await ppro.Metadata.getProjectMetadata(clipItem);
              console.log('ProjectItem metadata:', metadata);

              /*  BEN ADDED THIS! */
              
              let usedMediaList = new Set(); // Set of used media extensions

              // Get number of Video and Audio tracks to traverse
              let numVideoTracks = await sequence.getVideoTrackCount();
              let numAudioTracks = await sequence.getAudioTrackCount();

              // Traverse through each track and build list of media
              for(let trackNum = 0; trackNum < numVideoTrakcs; i++){  // for each video track
                let currentVideoTrack = await sequence.getVideoTrack(trackNum);
                let currentTrackItemsList = await currentVideoTrack.getTrackItems();
                for(let trackItemNum = 0; trackItemNum < currentTrackItemsList.length, trackItemNum++){ // for each video track item
                  let projItem = await currentTrackItemsList[trackItemNum].getProjectItem(); // get the project item of the track item
                  let clipProjItem = await ppro.ClipProjectItem.cast(projItem); // cast the project item to its respective clip project item to get much more data!

                  let filePath = await clipProjItem.getMediaFilePath();
                  
                  let splitPath = filePath.split('.')
                  usedMediaList.add(splitPath.pop()); // add the media file extension to the used media extensions list

                }
              } 

              var usedMediaListString = Array.from(usedMediaList).join(', ');  // this is sloppily instantiated with var so that it can be used globally later in the UI Rendering 
              /* --- END BEN STUFF --- */

              // You can add parsing here if you see useful info in the logs
            } catch (e) {
              console.log('Error getting ProjectItem metadata:', e);
            }
          }
        }
        uniqueFormats = Array.from(formatsSet).filter(Boolean);
      }
    }
  } catch (e) {}

  // === Render to UI ===
  let html = '';
  html += `<div class='pp-section'><div class='pp-section-header'>Premiere Pro</div><ul><li>Name: ${appName}</li><li>Version: ${appVersion}${appBuild ? ' (Build ' + appBuild + ')' : ''}</li></ul></div>`;
  html += `<div class='pp-section'><div class='pp-section-header'>System</div><ul><li>Platform: ${osPlatform}</li><li>OS Version: ${osVersion}</li><li>Arch: ${osArch}</li><li>GPU: ${gpuInfo}</li></ul></div>`;
  html += `<div class='pp-section'><div class='pp-section-header'>Project</div><ul><li>Name: ${projectName}</li></ul></div>`;
  html += `<div class='pp-section'><div class='pp-section-header'>Sequence Settings</div><ul><li>Name: ${sequenceName}</li><li>Frame Rate: ${sequenceFrameRate}</li><li>Frame Size: ${sequenceFrameSize}</li></ul></div>`;
  html += `<div class='pp-section'><div class='pp-section-header'>Codecs in Sequence</div><ul><li>H.264, ProRes, AAC</li></ul></div>`;
  html += `<div class='pp-section'><div class='pp-section-header'>Formats in Sequence</div><ul><li>${usedMediaListString}</li></ul></div>`;
  html += `<div class='pp-section'><div class='pp-section-header'>Third Party Plugins</div><ul><li>BorisFX, Mocha Pro</li></ul></div>`;

  // Insert after output-area
  let infoDiv = document.getElementById('pp-detailed-info');
  if (!infoDiv) {
    infoDiv = document.createElement('div');
    infoDiv.id = 'pp-detailed-info';
    document.querySelector('.premiere-panel').appendChild(infoDiv);
  }
  infoDiv.innerHTML = html;
}

// Auto-run on panel load
window.addEventListener('DOMContentLoaded', () => {
  gatherAndDisplayDetailedInfo();
});

// === Unique codecs from all timeline clips ===
async function getUniqueCodecsFromTimeline(sequence) {
  const codecsSet = new Set();
  if (!sequence) {
    return [];
  }
  if (!sequence.getVideoTracks) {
    // Fallback: scan all project items in the project
    try {
      const project = await require('premierepro').Project.getActiveProject();
      if (project && project.getRootItem) {
        const rootItem = await project.getRootItem();
        async function traverse(item) {
          if (item.type === 'BIN' || item.type === 'ROOT') {
            if (item.getItems) {
              const children = await item.getItems();
              if (Array.isArray(children)) {
                for (const child of children) {
                  await traverse(child);
                }
              }
            }
          } else if (item.type === 'CLIP' || item.type === 'FILE') {
            // Try getting media file path
            if (item.getMediaFilePath) {
              const mediaPath = await item.getMediaFilePath();
              if (mediaPath) {
                const extension = mediaPath.split('.').pop().toLowerCase();
                if (extension) {
                  codecsSet.add(extension.toUpperCase());
                }
              }
            }
            // Try footage interpretation
            if (item.getFootageInterpretation) {
              try {
                const interp = await item.getFootageInterpretation();
                if (interp) {
                  if (interp.codec) codecsSet.add(interp.codec);
                  if (interp.videoCodec) codecsSet.add(interp.videoCodec);
                  if (interp.compressionType) codecsSet.add(interp.compressionType);
                  if (interp.format) codecsSet.add(interp.format);
                }
              } catch (e) {
                console.log('Error getting footage interpretation (fallback):', e);
              }
            }
            // Try XMP metadata
            try {
              const xmp = require('uxp').xmp;
              if (xmp && item.getXMPMetadata) {
                const xmpData = await item.getXMPMetadata();
                console.log('XMP metadata (fallback):', xmpData);
              }
            } catch (e) {
              console.log('XMP not available or error (fallback):', e);
            }
          }
        }
        await traverse(rootItem);
      }
    } catch (e) {
      console.log('Error in fallback project item scan:', e);
    }
    return Array.from(codecsSet).filter(Boolean);
  }
  try {
    console.log('Getting codecs from timeline...');
    const videoTracks = await sequence.getVideoTracks();
    console.log('Video tracks found:', videoTracks.length);
    for (const track of videoTracks) {
      if (track.getClips) {
        const clips = await track.getClips();
        console.log('Clips in track:', clips.length);
        for (const clip of clips) {
          try {
            if (clip.getProjectItem) {
              const projectItem = await clip.getProjectItem();
              console.log('Project item:', projectItem);
              if (projectItem) {
                if (projectItem.getMediaFilePath) {
                  const mediaPath = await projectItem.getMediaFilePath();
                  console.log('Media path:', mediaPath);
                  if (mediaPath) {
                    const extension = mediaPath.split('.').pop().toLowerCase();
                    if (extension) {
                      codecsSet.add(extension.toUpperCase());
                    }
                  }
                }
                if (projectItem.getFootageInterpretation) {
                  try {
                    const interp = await projectItem.getFootageInterpretation();
                    console.log('Footage interpretation:', interp);
                    if (interp) {
                      if (interp.codec) codecsSet.add(interp.codec);
                      if (interp.videoCodec) codecsSet.add(interp.videoCodec);
                      if (interp.compressionType) codecsSet.add(interp.compressionType);
                      if (interp.format) codecsSet.add(interp.format);
                    }
                  } catch (e) {
                    console.log('Error getting footage interpretation:', e);
                  }
                }
                try {
                  const xmp = require('uxp').xmp;
                  if (xmp && projectItem.getXMPMetadata) {
                    const xmpData = await projectItem.getXMPMetadata();
                    console.log('XMP metadata:', xmpData);
                  }
                } catch (e) {
                  console.log('XMP not available or error:', e);
                }
              }
            }
          } catch (clipError) {
            console.log('Error processing clip:', clipError);
          }
        }
      }
    }
  } catch (e) {
    console.log('Error in getUniqueCodecsFromTimeline:', e);
  }
  return Array.from(codecsSet).filter(Boolean);
}

// Helper to get media types from sequence
async function getMediaTypesFromSequence(sequence) {
  const mediaTypes = new Set();

  // Video tracks
  if (sequence.getVideoTracks) {
    try {
      const videoTracks = await sequence.getVideoTracks();
      for (const track of videoTracks) {
        if (track.getClips) {
          const clips = await track.getClips();
          for (const clip of clips) {
            if (clip.getProjectItem) {
              const projectItem = await clip.getProjectItem();
              if (projectItem && projectItem.getFootageInterpretation) {
                try {
                  const interp = await projectItem.getFootageInterpretation();
                  if (interp) {
                    if (interp.codec) {
                      mediaTypes.add(interp.codec);
                    }
                    if (interp.format) {
                      mediaTypes.add(interp.format);
                    }
                    if (interp.fileType) {
                      mediaTypes.add(interp.fileType);
                    }
                    if (interp.description) {
                      mediaTypes.add(interp.description);
                    }
                  }
                } catch (e) {
                  console.error('Error in getFootageInterpretation:', e);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error in codec extraction:', e);
    }
  }

  // Audio tracks
  if (sequence.getAudioTracks) {
    try {
      const audioTracks = await sequence.getAudioTracks();
      for (const track of audioTracks) {
        if (track.getClips) {
          const clips = await track.getClips();
          for (const clip of clips) {
            if (clip.type === 2) mediaTypes.add('Audio');
          }
        }
      }
    } catch (e) {
      console.error('Error in audioTracks:', e);
    }
  }

  return Array.from(mediaTypes).join(', ') || 'Unknown';
}

// Helper to robustly calculate and format frame rate in fps
async function getSequenceFrameRate(sequence) {
  let frameRate = 'Unknown';
  // Try to get frameRate from ProjectItem first
  try {
    if (sequence.getProjectItem) {
      const projectItem = await sequence.getProjectItem();
      if (projectItem && typeof projectItem.frameRate === 'number') {
        frameRate = projectItem.frameRate.toFixed(3);
        return frameRate + ' fps';
      }
    }
  } catch (e) {}
  // Fallback to timebase/ticks logic if needed
  try {
    if (sequence.getTimebase) {
      const timebase = await sequence.getTimebase();
      if (typeof timebase === 'number') {
        if (timebase > 1000) {
          // Ticks per frame, convert to fps
          frameRate = (254016000000 / timebase).toFixed(3);
        } else {
          // Already a frame rate
          frameRate = timebase.toFixed(3);
        }
        return frameRate + ' fps';
      } else if (timebase && typeof timebase.seconds === 'number') {
        frameRate = (1 / timebase.seconds).toFixed(3);
        return frameRate + ' fps';
      } else if (typeof timebase === 'string') {
        const ticks = Number(timebase);
        if (!isNaN(ticks) && ticks > 1000) {
          frameRate = (254016000000 / ticks).toFixed(3);
        } else if (!isNaN(ticks)) {
          frameRate = ticks.toFixed(3);
        } else {
          frameRate = timebase;
        }
        return frameRate + ' fps';
      }
    }
  } catch (e) {}
  return frameRate;
} 