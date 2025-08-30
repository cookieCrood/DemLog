

async function getPunishments(client, player) {

    const UUID = await client.getUUID(player)
    if (!UUID) return { error: 'Player not found' }

    const globalLog = client.logs['global-log']
    let logs = {} // { "guild.name": { "demoted":"reason" } }

    Object.keys(globalLog).forEach((key) => {
        if (key.includes(UUID)) {
            const entry = globalLog[key]
            let stuff = {}
            let guildName = ''
            for (const type in entry) {
                if (type != 'temporaries') {
                    guildName = entry[type].guild.name
                    stuff[type] = entry[type].reason
                }
            }
            logs[guildName] = stuff
        }
    })

    return logs
}

async function getBulkUUIDs(usernames, options = { delay: 200 }) {
    if (!Array.isArray(usernames) || usernames.length === 0) {
        throw new Error("Usernames must be a non-empty array");
    }

    const results = {};

    for (const username of usernames) {
        if (options.delay) {
            await new Promise(resolve => setTimeout(resolve, options.delay));
        }

        try {
            const res = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
            const data = await res.json();

            if (data.success && data.data?.player) {
                results[username] = {
                    name: data.data.player.username,
                    id: data.data.player.id
                };
            } else {
                results[username] = null;
            }
        } catch (err) {
            console.error(`Failed to fetch ${username}: ${err.message}`);
            results[username] = null;
        }
    }

    return results;
}


async function getTabSummary(client, tab) {
    const globalLog = client.logs['global-log']
    const uuidList = await getBulkUUIDs(tab)
    const response = {}
    for (const name in uuidList) {
        const e = uuidList[name]
        if (!e) {
            response[name] = { IS_PLAYER_NICKED: true }
            continue
        }
        const UUID = (e || {id:"NO_ID_FOUND"}).id.replaceAll('-', '')
        Object.keys(globalLog).forEach((key) => {
            if (key.includes(UUID)) {
                const entry = globalLog[key]
                let stuff = {}
                let guild = ''
                let guildName = ''
                for (const type in entry) {
                    if (type != 'temporaries') {
                        guild = entry[type].guild.id
                        guildName = entry[type].guild.name
                        stuff[type] = entry[type].reason
                    }
                }
                if (!response[e.name]) response[e.name] = {}
                stuff.guildName = guildName
                response[e.name][guild] = stuff
            }
        })
        if (JSON.stringify(response[e.name]) === '{"":{"guildName":""}}') delete response[e.name]
    }
    return response
}

module.exports = {
    getPunishments,
    getTabSummary
}


