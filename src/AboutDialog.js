import React from 'react'
import Modal from 'antd/lib/modal'

function showAboutDialog() {
  Modal.info({
    title: 'Alchemists Solver',
    content: (
      <div>
        A helper app for <a href="http://czechgames.com/en/alchemists/">Alchemists</a>,
        Matúš Kotry's board game of logic, worker placement, and academic pride.
        All images belong to the game publishers.
        <br/>
        <br/>
        by Rafael, Ilan, and Benjamin Cosman
      </div>
    ),
  })
}

export {showAboutDialog}
