import React from 'react';

export default function LytDefault(cmp) {
    return (props) => {
        return (
            <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport"
                      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"/>
                <meta httpEquiv="X-UA-Compatible" content="ie=edge"/>
                <title>Layouts with Mangony and React</title>
            </head>
            <body>
            <header>Mangony React Renderer</header>
            <section style={{ backgroundColor: 'f3f3f3', height: '250px' }}>
            </section>
            <main id={'main'}>
                {cmp(props)}
            </main>
            <footer>footer</footer>
            </body>
            </html>
        )
    }
}
