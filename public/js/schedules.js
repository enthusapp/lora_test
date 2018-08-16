let schedule_template = () => pug`
    h4 Month Setting
    p
        ${Array(12).fill(1).map((v, i) => pug`
            button#month${i + 1}[type=button class="btn btn-primary btn-xs"]
                ${i + 1}
            |`
        )}
    h4 Day Setting
    p
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((v, i) => pug`
            button#day${i}[type=button class="btn btn-primary btn-xs"]
                ${v}
            |`
        )}
    h4 Hour Setting
    p
        ${Array(24).fill(1).map((v, i) => pug`
            button#hour${i}[type=button class="btn btn-primary btn-xs"]
                ${i}
            |`
        )}
    h4 Minute Setting
    p
        ${Array(60).fill(1).map((v, i) => pug`
            button#minute${i}[type=button class="btn btn-primary btn-xs"]
                ${i}
            |`
        )}`;

$(".sch-edit").append(schedule_template());