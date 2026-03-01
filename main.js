// <<<MAIN>>>
const base_url = 'https://www.deckofcardsapi.com/api/deck/'
const new_deck_url = getNewDeckUrl(true, false, 1) // shuffle, joker, decks
const deck_id = []
const back_of_card_image = 'https://www.deckofcardsapi.com/static/img/back.png'
const main_deck_remaining = []
let biddingLadder = getBiddingLadder()

// <<<SELECTOR>>>
const playerHand = document.querySelector('.player-hand')
const playerTable = document.querySelector('.player-table')
const playerFirst = document.querySelector('.player-first')
const playerBiddingResult = document.querySelector('.player-bidding-result')

const opponentHand = document.querySelector('.opponent-hand')
const opponentTable = document.querySelector('.opponent-table')
const opponentFirst = document.querySelector('.opponent-first')
const opponentBiddingResult = document.querySelector('.opponent-bidding-result')

const tableDecks = document.querySelector('.table-decks')
const tableCenter = document.querySelector('.table-center')
const start = document.querySelector('.start')
const gameText = document.querySelector('.game-text')

const sortCards = document.querySelector('.sort-cards')
const gameStage = document.querySelector('.game-stage')

// <<<PILE>>>
const player_hand = []
const player_played = []
const opponent_hand = []
const opponent_played = []
const faceup_card = []
// <<<GAME STAGE>>>
const first_picker = []
const first_bidder = []
const first_player = []
// <<<PARAMETER>>>
const player_bid = []
const player_bid_num = []
const player_bid_suit = []
const opponent_bid = []

const previous_card = []
const player_require_suit = []
const opponent_require_suit = []

// <<<EVENT LISTENER>>>
// <<<Stage 1: Page Loaded>>>
document.addEventListener('DOMContentLoaded', loadingPage)
async function loadingPage() {
  // New Deck Created
  const new_deck_data = await getData(new_deck_url)
  const id = new_deck_data.deck_id
  // Deck ID Pushed to [deck_id]
  deck_id.push(id)
  // [loadingPage] Event Listener Removed
  document.removeEventListener('DOMContentLoaded', loadingPage)
  // [startingGame] Event Listener Added
  start.addEventListener('click', startingGame)
}
// <<<Stage 2: Game Started>>>
async function startingGame(event) {
  const target = event.target
  // Start Button Clicked
  if (target.classList.contains('start-btn')) {
    // Start Button Removed
    target.remove()
    // Player [Draw 13 Cards]
    await drawCards(player_hand, 13)
    // [Unsorted] Player Hand Rendered
    renderHandCards(player_hand, playerHand) // unsorted
    // // Opponent [Draw 13 Cards]
    await drawCards(opponent_hand, 13)
    // [Sorted] Opponent Hand Rendered
    renderHandCards(opponent_hand, opponentHand, false) // sorted
    // Guessing Start Button Rendered
    start.innerHTML = `<button class="start-btn">Guessing</button>`
    // [startingGame] Event Listener Removed
    start.removeEventListener('click', startingGame)
    // [startGuessing] Event Listener Added
    start.addEventListener('click', startGuessing)
  }
}
// <<<Stage 3: Guessing Started>>>
async function startGuessing(event) {
  const target = event.target
  // Guessing Start Button Clicked
  if (target.classList.contains('start-btn')) {
    // Guessing Start Button Removed
    target.parentElement.remove()
    // Player Guessing Panel Rendered
    renderPlayerGuessingPanel()
    // Guessing Game Text Rendered
    gameText.innerText = 'Start guessing. Winner bids first.'
    // [startGuessing] Event Listener Removed
    start.removeEventListener('click', startGuessing)
    // [guessing] Event Listener Added
    playerTable.addEventListener('click', guessing)
  }
}
// <<<Stage 4: Guessing>>>
function guessing(event) {
  const target = event.target
  // Guessing Button Clicked
  if (target.hasAttribute('data-guess')) {
    const player = target.dataset.guess
    const opponent = getOpponentRandomGuess()
    const result = getGuessingResult(player, opponent) // 'Player', 'Opponent', 'Tie'
    // Opponent Guessing Result Rendered
    renderOpponentGuessingResult(opponent)
    // Guessing Game Text Changed
    gameText.innerText = getGuessingText(result)
    // Guessing Button Color Removed
    const removeClasses = ['guess-win', 'guess-lose', 'guess-tie']
    removeClassesFromSelectors('.guessing', removeClasses)
    // Guessing Result Color Toggled
    toggleGuessingResultColor(result, player, opponent)
    if (result !== 'Tie') {
      // First Bidder Pushed
      first_bidder.push(result)
      // Guessing Button Hover Removed
      removeClassesFromSelectors('.guessing', ['hover'])
      // Countdown Rendered
      let counter = 4
      const countInterval = setInterval(async () => {
        if (counter === 4) {
          gameText.innerText = getGuessingText(result)
          counter--
        } else if (counter > 0) {
          gameText.innerText = counter
          counter--
        } else if (counter === 0) {
          gameText.innerText = 'Start Bidding'
          counter--
        } else {
          // Remove Game Text
          gameText.innerText = ''
          // Remove Opponent Guessing Result
          opponentTable.innerHTML = ''
          // Render Player Bidding Panel
          renderPlayerBiddingPanel()
          // Toggle Suit Button [btn-closed] Class
          toggleClassesFromSelectors('.suit-btn', ['btn-closed'])
          // Toggle Player Hand Card Cursor
          toggleClassesFromSelectors('.card-img', ['card-cursor'], playerHand)
          // Sort Button Rendered
          sortCards.innerHTML = `<div class="sort-btn">Sort Cards</div>`
          // Render Game Stage
          gameStage.innerHTML = `<h1 class="game-stage-btn">Bidding</h1>`
          if (String(first_bidder) === 'Player') {
            // Render First Bidder
            playerFirst.innerHTML = `<div class="first-btn">First</div>`
            // Toggle Pass Button [btn-closed] Class
            toggleClassesFromSelectors('.pass-btn', ['btn-closed'])
          } else {
            // Render First Bidder
            opponentFirst.innerHTML = `<div class="first-btn">First</div>`
            // Opponent Random Bid
            getOpponentRandomBid(false)
            // Render Bidding Result
            renderBiddingResult('Opponent')
            const numBtn = document.querySelectorAll('.num-btn')
            numBtn.forEach((tag) => {
              const dataset = tag.dataset.num
              const isCompliant = getCompliantBidNum(biddingLadder, dataset)
              tag.classList.toggle('btn-closed', !isCompliant)
            })
          }
          // [sortingCards] Event Listener Added
          sortCards.addEventListener('click', sortingCards)
          // [moveCards] Event Listener Added
          playerHand.addEventListener('click', moveCards)
          // [biddingNum] Event Listener Added
          playerTable.addEventListener('click', biddingNum)
          // [biddingSuit] Event Listener Added
          playerTable.addEventListener('click', biddingSuit)
          // [biddingPass] Event Listener Added
          playerTable.addEventListener('click', biddingPass)
          // Clear Interval
          clearInterval(countInterval)
        }
      }, 1000)
      // [guessing] Event Listener Removed
      playerTable.removeEventListener('click', guessing)
    }
  }
}
// <<<Stage 5: Bidding>>>
// <<<Sort Cards>>>
function sortingCards(event) {
  const target = event.target
  // Sort Button Clicked
  if (target.classList.contains('sort-btn')) {
    // [Sorted] Player Hand Rendered
    renderHandCards(player_hand, playerHand, true) // sorted
    // Toggle Player Hand Card Cursor
    toggleClassesFromSelectors('.card-img', ['card-cursor'], playerHand)
  }
}
// <<<Move Cards>>>
async function moveCards(event) {
  const target = event.target
  // Card Clicked
  if (target.classList.contains('card-img')) {
    const targetCode = target.dataset.code
    // const targetSuit = targetCode[1]
    const previousCardObj = previous_card[0]
    const targetCard = player_hand.filter((card) => card.code === targetCode)
    const targetCardObj = targetCard[0]
    // First Clicked
    if (previousCardObj === undefined) {
      target.classList.toggle('card-clicked')
      previous_card.push(targetCardObj)
      // Second Clicked (Different Card)
    } else if (
      previousCardObj !== undefined &&
      previousCardObj !== targetCardObj
    ) {
      previous_card.length = 0
      changedHand(previousCardObj, targetCardObj)
      renderHandCards(player_hand, playerHand)
      toggleClassesFromSelectors('.card-img', ['card-cursor'], playerHand)
    }
  }
}
function biddingNum(event) {
  const target = event.target
  const num = Number(target.dataset.num)
  const previousNum = player_bid_num[0]
  const checkSuit = player_bid_suit[0]
  const diffBtn = Math.floor((35 - biddingLadder.length) / 5) + 1
  const suitBtn = document.querySelectorAll('.suit-btn')
  if (
    target.classList.contains('num-btn') &&
    getCompliantBidNum(biddingLadder, num) &&
    checkSuit === undefined &&
    opponent_bid[0] !== 'Pass' &&
    player_bid[0] !== 'Pass'
  ) {
    if (previousNum === undefined) {
      player_bid_num.length = 0
      player_bid_num.push(num)
      toggleOneClass(`[data-num="${num}"]`, 'btn-clicked')
      if (num === diffBtn) {
        toggleDiffBtns(suitBtn, biddingLadder, true)
      } else if (num !== diffBtn) {
        toggleAllClass('.suit-btn', 'btn-closed')
      }
    } else if (previousNum !== undefined) {
      toggleOneClass(`[data-num="${num}"]`, 'btn-clicked')
      if (previousNum === diffBtn) {
        if (num === previousNum) {
          player_bid_num.length = 0
          toggleDiffBtns(suitBtn, biddingLadder, true)
        } else if (num !== previousNum) {
          toggleOneClass(`[data-num="${previousNum}"]`, 'btn-clicked')
          player_bid_num.length = 0
          player_bid_num.push(num)
          toggleDiffBtns(suitBtn, biddingLadder, false)
        }
      } else if (previousNum !== diffBtn) {
        if (num === previousNum) {
          player_bid_num.length = 0
          toggleAllClass('.suit-btn', 'btn-closed')
        } else if (num !== previousNum) {
          toggleOneClass(`[data-num="${previousNum}"]`, 'btn-clicked')
          player_bid_num.length = 0
          player_bid_num.push(num)
          if (num === diffBtn) {
            toggleDiffBtns(suitBtn, biddingLadder, false)
          }
        }
      }
    }
  }
}
function biddingSuit(event) {
  const target = event.target
  const suit = target.dataset.suit
  const num = player_bid_num[0]
  const checkSuit = player_bid_suit[0]
  const passBtn = document.querySelector('.pass-btn')
  if (
    target.classList.contains('suit-btn') &&
    num !== undefined &&
    !target.classList.contains('btn-closed') &&
    checkSuit === undefined
  ) {
    target.classList.toggle('btn-clicked')
    const playerBid = String(num) + suit
    player_bid_suit.length = 0
    player_bid_suit.push(suit)
    player_bid.length = 0
    player_bid.push(playerBid)
    renderBiddingResult('Player')
    const bidIndex = biddingLadder.indexOf(playerBid)
    biddingLadder = biddingLadder.slice(bidIndex + 1)
    setTimeout(() => {
      player_bid_num.length = 0
      player_bid_suit.length = 0
      player_bid.length = 0
      if (opponentFirst.innerHTML !== '') {
        opponentFirst.innerHTML = ''
        first_bidder.length = 0
        passBtn.classList.remove('btn-closed')
      } else if (playerFirst.innerHTML !== '') {
        playerFirst.innerHTML = ''
        first_bidder.length = 0
        passBtn.classList.remove('btn-closed')
      }
      const numBtn = document.querySelectorAll('.num-btn')
      const suitBtn = document.querySelectorAll('.suit-btn')
      numBtn.forEach((tag) => tag.classList.remove('btn-closed'))
      numBtn.forEach((tag) => tag.classList.remove('btn-clicked'))
      suitBtn.forEach((tag) => tag.classList.remove('btn-closed'))
      suitBtn.forEach((tag) => tag.classList.remove('btn-clicked'))
      getOpponentRandomBid(false)
      renderBiddingResult('Opponent')
      if (opponent_bid[0] === 'Pass' || player_bid[0] === 'Pass') {
        if (opponent_bid[0] === 'Pass') {
          first_picker.push('Player')
        } else if (player_bid[0] === 'Pass') {
          first_picker.push('Opponent')
        }
        playerTable.removeEventListener('click', biddingNum)
        playerTable.removeEventListener('click', biddingSuit)
        playerTable.removeEventListener('click', biddingPass)
        playerHand.removeEventListener('click', moveCards)
        // changing cards stage
        toggleAllClass('.num-btn', 'btn-closed')
        toggleAllClass('.suit-btn', 'btn-closed')
        toggleAllClass('.pass-btn', 'btn-closed')
        if (opponentFirst.innerHTML !== '') {
          opponentFirst.innerHTML = ''
        } else if (playerFirst.innerHTML !== '') {
          playerFirst.innerHTML = ''
        }
        let counter = 4
        const countInterval = setInterval(async () => {
          if (counter === 4) {
            gameText.innerText =
              first_picker[0] === 'Player'
                ? 'Player Picks First'
                : 'Opponent  Picks First'
            counter--
          } else if (counter > 0) {
            gameText.innerText = counter
            counter--
          } else if (counter === 0) {
            gameText.innerText = 'Start Picking'
            counter--
          } else {
            // Remove Game Text
            gameText.innerText = ''
            // Remove PLayer Guessing Result
            playerTable.innerHTML = ''
            playerBiddingResult.innerHTML = ''
            opponentBiddingResult.innerHTML = ''
            // Render Main Deck
            renderMainDeck()
            // Faceup Card [Draw 1 Card]
            await drawCards(faceup_card, 1)
            // Render Faceup Card
            renderFaceupCard(faceup_card)
            // Toggle Player Hand Card Cursor
            toggleClassesFromSelectors('.card-img', ['card-cursor'], playerHand)
            // Render Game Stage
            gameStage.innerHTML = `<h1 class="game-stage-btn">Picking</h1>`
            if (String(first_picker) === 'Player') {
              // Render First Picker
              playerFirst.innerHTML = `<div class="first-btn">First</div>`
            } else {
              // Render First Picker
              opponentFirst.innerHTML = `<div class="first-btn">First</div>`
              // Render Opponent First Playing Card
              const opponentPlayed = getOpponentRandomPlay()
              // Player Require Suit
              player_require_suit.push(opponentPlayed[1])
              // Opponent Played [Draw 1 Card]
              playCard(opponent_hand, opponent_played, opponentPlayed)
              // Render Opponent Played
              renderPlayedCard(opponent_played, opponentTable)
              // Render Opponent Hand Card
              renderHandCards(opponent_hand, opponentHand, false)
            }
            // [moveAndPlayCards] Event Listener Added
            playerHand.addEventListener('click', picking)
            // Clear Interval
            clearInterval(countInterval)
          }
        }, 1000)
      } else {
        numBtn.forEach((tag) => {
          const dataset = tag.dataset.num
          if (getCompliantBidNum(biddingLadder, dataset) === false) {
            toggleOneClass(`[data-num="${dataset}"]`, 'btn-closed')
          }
        })
        toggleAllClass('.suit-btn', 'btn-closed')
      }
      // }
    }, 2500)
  }
}
function biddingPass(event) {
  const target = event.target
  const firstBidder = first_bidder[0]
  if (
    target.classList.contains('pass-btn') &&
    firstBidder !== 'Player' &&
    opponent_bid[0] !== 'Pass'
  ) {
    const numBtn = document.querySelectorAll('.num-btn')
    const suitBtn = document.querySelectorAll('.suit-btn')
    numBtn.forEach((tag) => tag.classList.remove('btn-closed'))
    numBtn.forEach((tag) => tag.classList.remove('btn-clicked'))
    suitBtn.forEach((tag) => tag.classList.remove('btn-closed'))
    suitBtn.forEach((tag) => tag.classList.remove('btn-clicked'))
    toggleAllClass('.num-btn', 'btn-closed')
    toggleAllClass('.suit-btn', 'btn-closed')
    target.classList.add('pass')
    player_bid.length = 0
    player_bid.push('Pass')
    renderBiddingResult('Player')
    playerTable.removeEventListener('click', biddingNum)
    playerTable.removeEventListener('click', biddingSuit)
    playerTable.removeEventListener('click', biddingPass)
    playerHand.removeEventListener('click', moveCards)
    first_picker.push('Opponent')
    if (opponentFirst.innerHTML !== '') {
      opponentFirst.innerHTML = ''
    } else if (playerFirst.innerHTML !== '') {
      playerFirst.innerHTML = ''
    }
    let counter = 4
    const countInterval = setInterval(async () => {
      if (counter === 4) {
        gameText.innerText =
          first_picker[0] === 'Player'
            ? 'Player Picks First'
            : 'Opponent  Picks First'
        counter--
      } else if (counter > 0) {
        gameText.innerText = counter
        counter--
      } else if (counter === 0) {
        gameText.innerText = 'Start Picking'
        counter--
      } else {
        // Remove Game Text
        gameText.innerText = ''
        // Remove PLayer Guessing Result
        playerTable.innerHTML = ''
        playerBiddingResult.innerHTML = ''
        opponentBiddingResult.innerHTML = ''
        // Render Main Deck
        renderMainDeck()
        // Faceup Card [Draw 1 Card]
        await drawCards(faceup_card, 1)
        // Render Faceup Card
        renderFaceupCard(faceup_card)
        // Toggle Player Hand Card Cursor
        toggleClassesFromSelectors('.card-img', ['card-cursor'], playerHand)
        // Render Game Stage
        gameStage.innerHTML = `<h1 class="game-stage-btn">Picking</h1>`
        if (String(first_picker) === 'Player') {
          // Render First Picker
          playerFirst.innerHTML = `<div class="first-btn">First</div>`
        } else {
          // Render First Picker
          opponentFirst.innerHTML = `<div class="first-btn">First</div>`
          // Render Opponent First Playing Card
          const opponentPlayed = getOpponentRandomPlay()
          // Player Require Suit
          player_require_suit.push(opponentPlayed[1])
          // Opponent Played [Draw 1 Card]
          playCard(opponent_hand, opponent_played, opponentPlayed)
          // Render Opponent Played
          renderPlayedCard(opponent_played, opponentTable)
          // Render Opponent Hand Card
          renderHandCards(opponent_hand, opponentHand, false)
        }
        // [moveAndPlayCards] Event Listener Added
        playerHand.addEventListener('click', picking)
        // Clear Interval
        clearInterval(countInterval)
      }
    }, 1000)
  }
}
// <<<Stage 6: Picking>>>
async function picking(event) {
  const target = event.target
  // Card Clicked
  if (target.classList.contains('card-img')) {
    const targetCode = target.dataset.code
    const targetSuit = targetCode[1]
    const previousCardObj = previous_card[0]
    const targetCard = player_hand.filter((card) => card.code === targetCode)
    const targetCardObj = targetCard[0]
    // First Clicked
    if (previousCardObj === undefined) {
      target.classList.toggle('card-clicked')
      previous_card.push(targetCardObj)
      // Second Clicked (Different Card)
    } else if (
      previousCardObj !== undefined &&
      previousCardObj !== targetCardObj
    ) {
      previous_card.length = 0
      changedHand(previousCardObj, targetCardObj)
      renderHandCards(player_hand, playerHand)
      toggleClassesFromSelectors('.card-img', ['card-cursor'], playerHand)
      // Second Clicked (Same Card)
    } else if (
      previousCardObj !== undefined &&
      previousCardObj === targetCardObj
    ) {
      previous_card.length = 0
      if (
        player_require_suit[0] === undefined ||
        player_require_suit[0] === targetSuit ||
        !player_hand.some((card) => card.suit === player_require_suit[0])
      ) {
        playerHand.removeEventListener('click', picking)
        const playerPlayed = targetCode
        playCard(player_hand, player_played, playerPlayed)
        renderPlayedCard(player_played, playerTable)
        renderHandCards(player_hand, playerHand)
        toggleClassesFromSelectors('.card-img', ['card-cursor'], playerHand)
        if (first_picker[0] === 'Player') {
          console.log('Player Play First')

          setTimeout(() => {
            opponent_require_suit.push(targetSuit)
            const opponentPlayed = getOpponentRandomPlay()
            playCard(opponent_hand, opponent_played, opponentPlayed)
            renderPlayedCard(opponent_played, opponentTable)
            renderHandCards(opponent_hand, opponentHand, false)
          }, 2000)
        }
        setTimeout(
          async () => {
            // Player Wins
            console.log(first_picker)
            const playResult = getPlayResult()
            console.log(`playResult: ${playResult}`)
            if (playResult === true) {
              console.log('Player Win')
              first_picker.length = 0
              first_picker.push('Player')
              console.log(`First Picker: ${first_picker}`)
              player_hand.push(...faceup_card)
              console.log('Faceup Card:')
              console.log(faceup_card)
              console.log('Player Hand:')
              console.log(player_hand)
              await drawCards(opponent_hand, 1)
              console.log('Opponent Hand:')
              console.log(opponent_hand)
              // Opponent Wins
            } else if (playResult === false) {
              console.log('Opponent Win')
              first_picker.length = 0
              first_picker.push('Opponent')
              console.log(`First Picker: ${first_picker}`)
              opponent_hand.push(...faceup_card)
              console.log('Faceup Card:')
              console.log(faceup_card)
              console.log('Opponent Hand:')
              console.log(opponent_hand)
              await drawCards(player_hand, 1)
              console.log('Player Hand:')
              console.log(player_hand)
            }
            setTimeout(async () => {
              await getMainDeckRemaining()
              console.log(
                `------------------------${main_deck_remaining[0]}---------------------------`
              )
              renderHandCards(player_hand, playerHand)
              toggleClassesFromSelectors(
                '.card-img',
                ['card-cursor'],
                playerHand
              )
              const lastCard = playerHand.children[0].children[12].children[0]
              lastCard.classList.toggle('received-card')
              setTimeout(() => {
                lastCard.classList.toggle('received-card')
              }, 2000)
              renderHandCards(opponent_hand, opponentHand, false)
              player_require_suit.length = 0
              opponent_require_suit.length = 0
              faceup_card.length = 0
              opponentTable.innerHTML = ''
              playerTable.innerHTML = ''
              if (main_deck_remaining[0] !== 0) {
                await drawCards(faceup_card, 1)
                renderFaceupCard(faceup_card)
                if (first_picker[0] === 'Player') {
                  playerFirst.innerHTML = `<div class="first-btn">First</div>`
                  opponentFirst.innerHTML = ''
                } else {
                  opponentFirst.innerHTML = `<div class="first-btn">First</div>`
                  playerFirst.innerHTML = ''
                  setTimeout(() => {
                    const opponentPlayed = getOpponentRandomPlay()
                    player_require_suit.push(opponentPlayed[1])
                    playCard(opponent_hand, opponent_played, opponentPlayed)
                    renderPlayedCard(opponent_played, opponentTable)
                    renderHandCards(opponent_hand, opponentHand, false)
                  }, 2000)
                }
                setTimeout(async () => {
                  playerHand.addEventListener('click', picking)
                }, 2000)
              } else {
                playerHand.removeEventListener('click', picking)
                tableDecks.remove()
                gameText.innerHTML = `<h1 class="game-stage-btn">Playing</h1>`
                const firstBidder = first_picker[0]
                first_picker.length = 0
                // Render Player Bidding Panel
                // Render Tricks Panel
                if (firstBidder === 'Player') {
                  // Player Win
                  first_bidder.push(firstBidder)
                } else {
                  // Opponent Win
                  first_bidder.push(firstBidder)
                  // Render Opponent Bid Result
                }

                // playerTable.addEventListener('click', bidding)
              }
            }, 2000)
            if (first_picker[0] === 'Player') {
            }
          },
          first_picker[0] === 'Player' ? 2000 : 0
        )

        // Wrong Card
      } else {
        target.classList.toggle('card-clicked')
        target.classList.toggle('wrong-card')
        playerHand.removeEventListener('click', picking)
        setTimeout(() => {
          target.classList.toggle('wrong-card')
          playerHand.addEventListener('click', picking)
        }, 2000)
      }
    }
  }
}

// <<<FUNCTION>>>
async function drawCards(data, count) {
  const draw_card_url = getDrawCardUrl(count)
  const draw_card_data = await getData(draw_card_url)
  const draw_card_data_cards = draw_card_data.cards
  const filtered_data = getFilteredData(draw_card_data_cards)
  data.push(...filtered_data)
}
function toggleGuessingResultColor(result, player, opponent) {
  if (result !== 'Tie') {
    if (result === 'Player') {
      toggleClassesFromSelectors(
        `[data-guess="${player}"]`,
        ['guess-win'],
        playerTable
      )
      toggleClassesFromSelectors(
        `[data-guess="${opponent}"]`,
        ['guess-lose'],
        opponentTable
      )
    } else {
      toggleClassesFromSelectors(
        `[data-guess="${opponent}"]`,
        ['guess-win'],
        opponentTable
      )
      toggleClassesFromSelectors(
        `[data-guess="${player}"]`,
        ['guess-lose'],
        playerTable
      )
    }
  } else {
    toggleClassesFromSelectors(
      `[data-guess="${player}"]`,
      ['guess-tie'],
      playerTable
    )
    toggleClassesFromSelectors(
      `[data-guess="${opponent}"]`,
      ['guess-tie'],
      opponentTable
    )
  }
}
// Bidding
// Picking
function playCard(hand, played, card) {
  const changedHand = hand.filter((obj) => obj.code !== card)
  const playedCard = hand.filter((obj) => obj.code === card)
  hand.length = 0
  hand.push(...changedHand)
  played.length = 0
  played.push(...playedCard)
}
function changedHand(previous, target) {
  const changedHand = player_hand.map((card) => {
    if (card.code === previous.code) {
      return target
    } else if (card.code === target.code) {
      return previous
    } else {
      return card
    }
  })
  player_hand.length = 0
  player_hand.push(...changedHand)
}
// <CLASS MODIFICATION>
function toggleClassesFromSelectors(selector, className, element) {
  className.forEach((e) => {
    if (element !== undefined) {
      const tags = element.querySelectorAll(selector)
      tags.forEach((tag) => tag.classList.toggle(e))
    } else {
      const tags = document.querySelectorAll(selector)
      tags.forEach((tag) => tag.classList.toggle(e))
    }
  })
}
function removeClassesFromSelectors(selector, className, element) {
  className.forEach((e) => {
    if (element !== undefined) {
      const tags = element.querySelectorAll(selector)
      tags.forEach((tag) => tag.classList.remove(e))
    } else {
      const tags = document.querySelectorAll(selector)
      tags.forEach((tag) => tag.classList.remove(e))
    }
  })
}
function toggleAllClass(selector, className) {
  const tags = document.querySelectorAll(selector)
  tags.forEach((tag) => tag.classList.toggle(className))
}
function toggleOneClass(selector, className) {
  const tag = document.querySelector(selector)
  tag.classList.toggle(className)
}
function toggleDiffBtns(btn, ladder, toggle) {
  btn.forEach((tag) => {
    const dataset = tag.dataset.id
    if (getCompliantBidSuit(ladder, dataset) === toggle) {
      toggleOneClass(`[data-id="${dataset}"]`, 'btn-closed')
    }
  })
}
// <<<RENDER>>>
function renderHandCards(data, area, sort) {
  let htmlContent = `<div class="hand">`
  getSortedCards(data, sort)
  data.forEach((card) => {
    if (area.classList.contains('player-hand')) {
      htmlContent += `<div class="card">
  <img src="${card.image}" class="card-img" data-code="${card.code}">
</div>`
    } else {
      htmlContent += `<div class="card">
    <img src="${back_of_card_image}" class="card-img">
  </div>`
    }
  })
  htmlContent += `</div>`
  area.innerHTML = htmlContent
}
function renderPlayerGuessingPanel() {
  playerTable.innerHTML = `<div class="player-guessing-panel">
  <i class="fa-regular fa-hand guessing hover" data-guess="paper"></i>
  <i class="fa-regular fa-hand-peace guessing hover" data-guess="scissors"></i>
  <i class="fa-regular fa-hand-back-fist guessing hover" data-guess="stone"></i>
</div>`
}
function renderOpponentGuessingResult(guess) {
  const paper = `<i class="fa-regular fa-hand guessing" data-guess="${guess}"></i>`
  const scissors = `<i class="fa-regular fa-hand-peace guessing" data-guess="${guess}"></i>`
  const stone = `<i class="fa-regular fa-hand-back-fist guessing" data-guess="${guess}"></i>`

  const htmlContent = `<div class="player-guessing-panel">${
    guess === 'paper' ? paper : guess === 'scissors' ? scissors : stone
  }</div></div>`
  opponentTable.innerHTML = htmlContent
}
// Bidding
function renderPlayerBiddingPanel() {
  let htmlContent = `<div class="player-bidding-panel">
  <div class="num-suit-container">
    <div class="num-container">
      <button class="num-btn" data-num="1">1</button>
      <button class="num-btn" data-num="2">2</button>
      <button class="num-btn" data-num="3">3</button>
      <button class="num-btn" data-num="4">4</button>
      <button class="num-btn" data-num="5">5</button>
      <button class="num-btn" data-num="6">6</button>
      <button class="num-btn" data-num="7">7</button>
    </div>
    <div class="suit-container">
      <button class="suit-btn" data-suit="C" data-id="1">&clubsuit;</button>
      <button class="suit-btn" data-suit="D" data-id="2"><span class="red-entity">&diamondsuit;</span></button>
      <button class="suit-btn" data-suit="H" data-id="3"><span class="red-entity">&heartsuit;</span></button>
      <button class="suit-btn" data-suit="S" data-id="4">&spadesuit;</button>
      <button class="suit-btn" data-suit="N" data-id="5">NT</button>
    </div>
  </div>
  <div class="pass-container">
    <button class="pass-btn">Pass</button>
  </div>
</div>`
  playerTable.innerHTML = htmlContent
}
function renderBiddingResult(who) {
  const bidResult = document.createElement('button')
  bidResult.classList.add('bidding-result-btn')
  if (opponent_bid[0] === 'Pass' || player_bid[0] === 'Pass') {
    bidResult.classList.add('pass')
  }
  const bid_result = who === 'Player' ? player_bid[0] : opponent_bid[0]
  const area = who === 'Player' ? playerBiddingResult : opponentBiddingResult
  const innerHTML = getResultToInnerHTML(bid_result)
  bidResult.innerHTML = innerHTML
  console.log(bidResult)
  area.innerHTML = ''
  area.append(bidResult)
  console.log(area)
}
// Picking
function renderMainDeck() {
  tableDecks.innerHTML = `<div class="main-deck">
  <div class="card">
    <img src="${back_of_card_image}" class="card-img" />
  </div>
</div>`
}
function renderFaceupCard(data) {
  const card = data[0]
  faceupCard = document.createElement('div')
  faceupCard.classList.add('faceup-card')
  faceupCard.innerHTML = `<div class="card">
  <img src="${card.image}" class="card-img" />
</div>`
  if (tableDecks.children[1]) {
    tableDecks.replaceChild(faceupCard, tableDecks.children[1])
  } else {
    tableDecks.append(faceupCard)
  }
}
function renderPlayedCard(data, area) {
  const card = data[0]
  area.innerHTML = `<div class="card">
      <img src="${card.image}" class="card-img" />
    </div>`
}
// <<<GET DATA>>>
function getFilteredData(data, store) {
  const filteredData = data.map((card) => {
    const rank =
      isNaN(Number(card.value)) === true
        ? getRankFromValue(card.value)
        : Number(card.value) - 1
    const suit = card.suit[0]
    return {
      code: card.code,
      image: card.image,
      rank: rank,
      suit: suit
    }
  })
  return filteredData
}
function getRankFromValue(value) {
  if (value === 'ACE') {
    return 13
  } else if (value === 'KING') {
    return 12
  } else if (value === 'QUEEN') {
    return 11
  } else if (value === 'JACK') {
    return 10
  }
}
function getSortedCards(cards, order) {
  if (order === undefined) {
    return cards
  }
  order === true ? (order = -1) : (order = 1)
  cards.sort((a, b) => {
    const suitComparison = (a.suit.charCodeAt(0) - b.suit.charCodeAt(0)) * order
    const result =
      suitComparison !== 0 ? suitComparison : (a.rank - b.rank) * order
    return result
  })
}
function getOpponentRandomGuess() {
  const guessNum = Math.ceil(Math.random() * 3)
  const guess = guessNum === 1 ? 'paper' : guessNum === 2 ? 'scissors' : 'stone'
  return guess
  // return 'paper'
}
function getGuessingResult(player, opponent) {
  if (
    (player === 'paper' && opponent === 'stone') ||
    (player === 'scissors' && opponent === 'paper') ||
    (player === 'stone' && opponent === 'scissors')
  ) {
    return 'Player'
  } else if (
    (player === 'paper' && opponent === 'scissors') ||
    (player === 'scissors' && opponent === 'stone') ||
    (player === 'stone' && opponent === 'paper')
  ) {
    return 'Opponent'
  } else {
    return 'Tie'
  }
}
function getGuessingText(result) {
  if (result === 'Player') {
    return 'Player Wins'
  } else if (result === 'Opponent') {
    return 'Opponent Wins'
  } else {
    return 'Tie'
  }
}
// Bidding
function getResultToInnerHTML(bid_result) {
  if (bid_result !== 'Pass') {
    const num = bid_result[0]
    const suit = bid_result[1]
    const result =
      suit === 'S'
        ? `${num}&spadesuit;`
        : suit === 'H'
        ? `${num}<span class="red-entity">&heartsuit;</span>`
        : suit === 'D'
        ? `${num}<span class="red-entity">&diamondsuit;</span>`
        : suit === 'C'
        ? `${num}&clubsuit;`
        : `${num}NT`
    return result
  } else {
    return 'Pass'
  }
}
function getOpponentRandomBid(pass) {
  const randomPassNum = Math.floor(Math.random() * 2)
  const randomBidNum = Math.floor(Math.random() * biddingLadder.length)
  if (biddingLadder.length !== 0) {
    const bid = biddingLadder[randomBidNum]
    biddingLadder = biddingLadder.slice(randomBidNum + 1)
    if (pass === true) {
      if (randomPassNum === 0) {
        opponent_bid.length = 0
        opponent_bid.push(bid)
      } else {
        opponent_bid.length = 0
        opponent_bid.push('Pass')
      }
    } else {
      opponent_bid.length = 0
      opponent_bid.push(bid)
    }
  } else {
    opponent_bid.length = 0
    opponent_bid.push('Pass')
  }
}
function getCompliantBidNum(ladder, dataset) {
  const bid = 35 - ladder.length
  const num = Math.floor(bid / 5)
  if (Number(dataset) > num) {
    return true
  } else {
    return false
  }
}
function getCompliantBidSuit(ladder, dataset) {
  const bid = 35 - ladder.length
  if (Number(dataset) > bid % 5) {
    return true
  } else {
    return false
  }
}
// Picking
function getOpponentRandomPlay() {
  if (
    opponent_require_suit[0] === undefined ||
    !opponent_hand.some((card) => card.suit === opponent_require_suit[0])
  ) {
    const cardCount = opponent_hand.length
    const random = Math.floor(Math.random() * cardCount)
    const playedCard = opponent_hand[random].code
    return playedCard
  } else {
    const availablePlayCards = opponent_hand.filter(
      (card) => card.suit === opponent_require_suit[0]
    )
    const cardCount = availablePlayCards.length
    const random = Math.floor(Math.random() * cardCount)
    const playedCard = availablePlayCards[random].code
    return playedCard
  }
}
function getPlayResult() {
  const playerCard = player_played[0]
  const opponentCard = opponent_played[0]
  if (first_picker[0] === 'Player') {
    if (playerCard.suit !== opponentCard.suit) {
      return true
    } else if (playerCard.rank > opponentCard.rank) {
      return true
    } else {
      return false
    }
  } else if (first_picker[0] === 'Opponent') {
    if (opponentCard.suit !== playerCard.suit) {
      return false
    } else if (opponentCard.rank > playerCard.rank) {
      return false
    } else {
      return true
    }
  }
}
// <API URL>
function getNewDeckUrl(shuffle, joker, decks) {
  const shuffleValue = shuffle ? 'shuffle/' : ''
  return `${base_url}new/${shuffleValue}?jokers_enabled=${joker}&deck_count=${decks}`
}
function getDrawCardUrl(count) {
  const draw_card_url = base_url + String(deck_id) + `/draw/?count=${count}`
  return draw_card_url
}
// <API DATA>
async function getData(url) {
  const response = await fetch(url)
  const data = await response.json()
  return data
}
async function getMainDeckRemaining() {
  const main_deck_url = base_url + deck_id
  const main_deck_data = await getData(main_deck_url)
  const remaining = main_deck_data.remaining
  main_deck_remaining.length = 0
  main_deck_remaining.push(remaining)
}
// <GAME DATA>
function getBiddingLadder() {
  const result = []
  const suits = ['C', 'D', 'H', 'S', 'N']
  for (let level = 1; level <= 7; level++) {
    for (let i = 0; i < 5; i++) {
      result.push(String(level) + suits[i])
    }
  }
  return result
}
