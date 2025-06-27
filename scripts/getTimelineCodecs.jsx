function getTimelineCodecs() {
    var seq = app.project.activeSequence;
    var codecs = {};
    if (seq && seq.videoTracks && seq.videoTracks.numTracks) {
        for (var i = 0; i < seq.videoTracks.numTracks; i++) {
            var track = seq.videoTracks[i];
            for (var j = 0; j < track.clips.numItems; j++) {
                var clip = track.clips[j];
                if (clip && clip.projectItem) {
                    // Try to get codec from XMP metadata
                    var xmp = clip.projectItem.getXMPMetadata();
                    var codec = "";
                    if (xmp && xmp.indexOf("videoCodec") !== -1) {
                        var match = xmp.match(/videoCodec=\"([^\"]+)\"/);
                        if (match && match[1]) {
                            codec = match[1];
                        }
                    }
                    // Fallback: use file extension as a last resort
                    if (!codec && clip.projectItem.name) {
                        var parts = clip.projectItem.name.split(".");
                        if (parts.length > 1) {
                            codec = parts[parts.length - 1].toUpperCase();
                        }
                    }
                    if (codec) {
                        codecs[codec] = true;
                    }
                }
            }
        }
    }
    return JSON.stringify(Object.keys(codecs));
}
getTimelineCodecs();