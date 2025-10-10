

async function getPunishments(client, player) {

    const UUID = await client.getUUID(player)
    if (!UUID) return { error: 'Player not found' }

    let logs = {} // { "guild.name": { "demoted":"reason" } }

    const punishments = await client.db.getPunishments(UUID)

    punishments.forEach((p) => {
        if (!logs[p.guild]) {
            logs[p.guild] = [ [ p.punishment, p.reason ] ]
        } else {
            logs[p.guild].push( [ p.punishment, p.reason ] )
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

module.exports = {
    getPunishments
}


