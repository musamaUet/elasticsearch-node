const express = require('express');
const elasticsearch = require('elasticsearch');
const router = express.Router();
var fs = require('fs');

const client = new elasticsearch.Client({
    host: process.env.ES_HOST,
    log: 'error'
});

client.ping({ requestTimeout: 30000 }, function (err) {
    if (err) {
        console.log('elasticsearch is down right now');
    } else {
        console.log('Evenrything is working fine now')
    }
});


const bulkIndex = function (index, type, data) {
    let bulkBody = [];

    data.forEach(item => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item.id
            }
        });
        bulkBody.push(item);
    });

    client.bulk({ body: bulkBody }).then(response => {
        let errorCount = 0;
        response.items.forEach(item => {
            if (item.index && item.index.error) {
                console.log(++errorCount, item.index.error);
            }
        });
        console.log(
            `Successfully indexed ${data.length - errorCount}
            out of ${data.length} items`
        );
    }).catch(console.err);

}
async function indexData() {
    console.log('inside indexData');
    const jobsRaw = await fs.readFileSync('./MOCK_DATA.json');
    const jobs = JSON.parse(jobsRaw);
    console.log(`${jobs.length} items parsed from data file`);
    bulkIndex('job', 'json', jobs);
};

router.use((req, res, next) => {
    client.index({
        index: 'logs',
        body: {
            url: req.url,
            method: req.method
        }
    }).then(res => {
        console.log('Logs indexed', res);
    }).catch(err => {
        console.log('esError', err);
    });
    indexData();
    next();
})
router.get('/job/:id', (req, res) => {
    let query = {
        index: 'job',
        id: req.params.id
    }
    client.get(query).then(resp => {
        if (!resp) {
            return res.status(404).json({ message: 'No job found against this job id' });
        }
        return res.status(201).json({ message: resp })
    }).catch(err => {
        return res.status(500).json({
            message: 'Error not found',
            err
        })
    });
});

router.post('/job', (req, res) => {

    client.index({
        index: 'job',
        body: req.body
    })
        .then(resp => {
            return res.status(200).json({
                msg: 'job indexed' + JSON.stringify(resp)
            });
        })
        .catch(err => {
            return res.status(500).json({
                msg: 'Error',
                err
            });
        })


});

router.put('/job/:id', (req, res) => {
    client.update({
        index: 'jobs',
        id: req.params.id,
        body: {
            doc: req.body
        }
    })
        .then(resp => {
            return res.status(200).json({
                msg: 'jobs updated'
            });
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({
                msg: 'Error',
                err
            });
        })
});

router.delete('/job/:id', (req, res) => {
    client.delete({
        index: 'job',
        id: req.params.id
    })
        .then(resp => {
            res.status(200).json({
                'msg': 'Job deleted'
            });
        })
        .catch(err => {
            res.status(404).json({
                'msg': 'Error'
            });
        });
});

router.get('/jobs', (req, res) => {
    const from = parseInt(req.query.from || 0);
    const size = parseInt(req.query.size || 10);
    let query = {
        index: 'job'
    }
    console.log('req.query', req.query);
    if (req.query.job_title) query.q = `*${req.query.job_title}*`;
    client.search({ index: query.index, from, size })
        .then(resp => {
            return res.status(200).json({
                jobs: resp.hits.hits
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                msg: 'Error',
                err
            });
        });
});


module.exports = router;