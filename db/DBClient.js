
const Debug = require('../util/Debug')
const { createClient } = require('@libsql/client')
const { url, key } = require('../config.json').db

class DBError {
    dberror = true
    message
    code
    constructor(message = 'An Error occured!', code = 0) {
        this.message = message
        this.code = code
    }
}

class DBClient {
    client

    static Roles = Object.freeze({
        LOG: "LOG",
        DELETE: "DELETE",
    })

    static PunishmentTypes = Object.freeze({
        DEMOTION: "DEMOTION",
        MUTE: "MUTE",
        BAN: "BAN",
        WARN: "WARN",
        NOTE: "NOTE"
    })

    constructor () {
        this.client = createClient({
            url,
            authToken: key
        })
    }

    async run(sql, args) {
        if (args !== undefined) {
            if (args.some(a => a === undefined)) {
                throw new Error('[DBClient] Got undefined argument')
            }
        }
        return this.client.execute({
            sql,
            args: (args === undefined ? [] : args)
        });
    }

    async executeSafely(call) {
        try {
            return call()
        } catch(e) {
            Debug.error(e)
            return new DBError(e, -1)
        }
    }

    async getPunishments(uuid) {
        return this.executeSafely(async () => {
            const punishments = (await this.run(`
                SELECT *
                FROM Log
                WHERE uuid = ?
            `,
                [
                    uuid,
                ]
            )).rows

            if (punishments.length === 0) {
                return null
            }

            return punishments
        })
    }

    async getGuildPunishments(uuid, guild) {
        return this.executeSafely(async () => {
            const punishments = (await this.run(`
                SELECT *
                FROM Log
                WHERE uuid = ?
                AND guild = ?
            `,
                [
                    uuid,
                    guild
                ]
            )).rows

            if (punishments.length === 0) {
                return null
            }

            return punishments
        })
    }

    async addGuildPunishment(uuid, username, punishment, reason, loggedId, loggedName, guild, messageId, globalMessageId, date) {
        return this.executeSafely(async () => {
            const newPunishment = await this.run(`
                INSERT INTO Log (uuid, username, punishment, reason, loggedId, loggedName, guild, messageId, globalMessageId, date)
                     VALUES     (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `,
                [
                    uuid, username, punishment, reason, loggedId, loggedName, guild, messageId, globalMessageId, date
                ]
            )

            return newPunishment
        })
    }

    async getPunishmentById(id) {
        return this.executeSafely(async () => {
            const punishment = (await this.run(`
                SELECT *
                  FROM Log
                 WHERE id = ?
            `,
                [
                    id
                ]
            )).rows

            if (punishment.length == 0) {
                return null
            }


            return punishment[0]
        })
    }

    async deleteGuildPunishment(guild, id) {
        return this.executeSafely(async () => {
            const removedPunishment = await this.run(`
                DELETE FROM Log
                      WHERE guild = ?
                        AND id = ?
            `,
                [
                    guild,
                    id
                ]
            )

            return removedPunishment
        })
    }

    async countTotalLogs() {
        return this.executeSafely(async () => {
            const amount = await this.run(`
                SELECT COUNT(*) AS total FROM Log
            `)

            return amount.rows[0].total
        })
    }

    async createSetup(guild) {
        return this.executeSafely(async () => {
            const newSetup = await this.run(`
                INSERT INTO Setup (guild)
                     VALUES       (?);    
            `,
                [
                    guild
                ]
            )

            return newSetup
        })
    }

    async setLogChannel(guild, channel) {
        return this.executeSafely(async () => {
            const logChannel = await this.run(`
                UPDATE Setup
                   SET channel = ?
                 WHERE guild = ?
            `,
                [
                    channel,
                    guild
                ]
            )

            return logChannel
        })
    }

    async getLogChannel(guild) {
        return this.executeSafely(async () => {
            const logChannel = await this.run(`
                SELECT channel
                  FROM Setup
                 WHERE guild = ?
            `,
                [
                    guild
                ]
            )

            if (logChannel.rows[0]) {
                return logChannel.rows[0].channel
            }
            return false
        })
    }

    async addSetupRole(guild, role, type) {
        return this.executeSafely(async () => {
            const newRole = await this.run(`
                INSERT INTO SetupRole (guild, role, type)
                    VALUES            (?, ?, ?);
            `,
                [
                    guild,
                    role,
                    type
                ]
            )

            return newRole
        })
    }

    async removeSetupRole(guild, role, type) {
        return this.executeSafely(async () => {
            const removeRole = await this.run(`
                DELETE FROM SetupRole
                      WHERE guild = ?
                        AND role  = ?
                        AND type  = ?    
            `,
                [
                    guild,
                    role,
                    type
                ]
            )
        })
    }

    async getSetupRoles(guild, type) {
        return this.executeSafely(async () => {
            const setup = await this.run(`
                SELECT role 
                  FROM SetupRole
                 WHERE guild = ?
                   AND type  = ?
            `,
                [
                    guild,
                    type
                ]
            )

            return setup.rows.map(obj => obj.role)
        })
    }

    async getSetup(guild) {
        return this.executeSafely(async () => {
            const result = await this.run(`
                SELECT 
                    S.channel,
                    (SELECT GROUP_CONCAT(role) 
                    FROM SetupRole 
                    WHERE guild = S.guild AND type = ?) AS LOG,
                    (SELECT GROUP_CONCAT(role) 
                    FROM SetupRole 
                    WHERE guild = S.guild AND type = ?) AS "DELETE"
                FROM Setup S
                WHERE S.guild = ?
            `, 
            [
                DBClient.Roles.LOG,
                DBClient.Roles.DELETE,
                guild
            ]);

            const row = result.rows[0];
            if (!row) {
                return {
                    channel: null,
                    LOG: [],
                    DELETE: []
                };
            }

            return {
                channel: row.channel ?? null,
                LOG: row.LOG ? row.LOG.split(',') : [],
                DELETE: row.DELETE ? row.DELETE.split(',') : [],
            };
        });
    }

    async whiteListAdd(userId, username) {
        return this.executeSafely(async () => {
            const newUser = await this.run(`
                INSERT INTO Whitelist (userId, username)
                     VALUES           (?, ?);
            `,
                [
                    userId,
                    username
                ]
            )

            return newUser
        })
    }

    async whiteListRemove(userId) {
        return this.executeSafely(async () => {
            const removedUser = await this.run(`
                DELETE FROM Whitelist
                      WHERE userId = ?
            `,
                [
                    userId
                ]
            )
        })
    }

    async whiteListCheck(userId) {
        return this.executeSafely(async () => {
            const res = await this.run(`
                SELECT userId
                  FROM Whitelist
                 WHERE userId = ?
            `,
                [
                    userId
                ]
            )

            return res.rows.length === 1
        })
    }

    async leaderboard() {
        return this.executeSafely(async () => {
            const leaderboard = await this.run(`
                SELECT COUNT(*) as total, guild as id
                  FROM Log
                 GROUP BY guild
            `,
            [
            ])

            return leaderboard.rows
        })
    }

    async countGuild(guild) {
        return this.executeSafely(async () => {
            const amount = await this.run(`
                SELECT COUNT(*) AS amount
                  FROM Log
                 WHERE guild = ?
            `, [
                guild
            ])
        })
    }

    async getUserLogsInGuild(user, guild) {
        return this.executeSafely(async () => {
            const amount = await this.run(`
                SELECT COUNT(*) AS amount
                  FROM Log
                 WHERE loggedId = ?
                   AND guild = ?
            `, [
                user,
                guild
            ])

            return amount.rows[0].amount
        })
    }

    async getGuildLeaderboard(guild, max) {
        return this.executeSafely(async () => {
            const leaderboard = await this.run(`
                SELECT COUNT(*) AS count, loggedId AS id
                  FROM Log
                 WHERE guild = ?
                 GROUP BY loggedId
                 ORDER BY count DESC
                 LIMIT ?
            `, [
                guild,
                max
            ])

            return leaderboard.rows
        })
    }
}

module.exports = DBClient