use anchor_lang::prelude::*;
use mpl_bubblegum::instructions::MintToCollectionV1CpiBuilder;
use mpl_bubblegum::types::{MetadataArgs, Creator, TokenProgramVersion, TokenStandard};

declare_id!("CPQ675bubG8nKQ31vPQDERePWEiRpv2VuC7KYZMJ9y1r");

#[error_code]
pub enum ErrorCode {
    #[msg("Collection is full")]
    CollectionFull,
    #[msg("Unauthorized")]
    Unauthorized,
}

#[account]
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub collection_mint: Pubkey,
    pub total_minted: u64,
    pub max_capacity: u64,
    pub bump: u8,
}

impl CollectionConfig {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

#[program]
pub mod y100go_bubblegum_badge {
    use super::*;

    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        max_capacity: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.collection_mint = ctx.accounts.collection_mint.key();
        config.total_minted = 0;
        config.max_capacity = max_capacity;
        config.bump = ctx.bumps.config;

        msg!("✅ Collection initialized: {} max capacity", max_capacity);
        Ok(())
    }

    pub fn mint_badge<'info>(
        ctx: Context<'_, '_, '_, 'info, MintBadge<'info>>,
        name: String,
        uri: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(config.total_minted < config.max_capacity, ErrorCode::CollectionFull);

        let leaf_index = config.total_minted;
        let collection_mint = config.collection_mint;

        // Metadata
        let metadata = MetadataArgs {
            name,
            symbol: "Y100GO".to_string(),
            uri,
            seller_fee_basis_points: 500, // 5% royalty
            primary_sale_happened: false,
            is_mutable: true,
            edition_nonce: Some(0),
            token_standard: Some(TokenStandard::NonFungible),
            collection: Some(mpl_bubblegum::types::Collection {
                verified: false,
                key: collection_mint,
            }),
            uses: None,
            token_program_version: TokenProgramVersion::Original,
            creators: vec![Creator {
                address: ctx.accounts.payer.key(),
                verified: false,
                share: 100,
            }],
        };

        // Mint via Bubblegum
        MintToCollectionV1CpiBuilder::new(&ctx.accounts.bubblegum_program.to_account_info())
            .tree_config(&ctx.accounts.tree_config)
            .leaf_owner(&ctx.accounts.recipient)
            .leaf_delegate(&ctx.accounts.recipient)
            .merkle_tree(&ctx.accounts.merkle_tree)
            .payer(&ctx.accounts.payer)
            .tree_creator_or_delegate(&ctx.accounts.payer.to_account_info())
            .collection_authority(&ctx.accounts.payer.to_account_info())
            .collection_authority_record_pda(None)
            .collection_mint(&ctx.accounts.collection_mint.to_account_info())
            .collection_metadata(&ctx.accounts.collection_metadata)
            .collection_edition(&ctx.accounts.edition_account)
            .bubblegum_signer(&ctx.accounts.bubblegum_signer)
            .log_wrapper(&ctx.accounts.log_wrapper)
            .compression_program(&ctx.accounts.compression_program)
            .token_metadata_program(&ctx.accounts.token_metadata_program)
            .system_program(&ctx.accounts.system_program)
            .metadata(metadata)
            .invoke()?;

        config.total_minted += 1;

        msg!("✅ Badge #{} minted to {}", leaf_index, ctx.accounts.recipient.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = payer,
        space = CollectionConfig::LEN,
        seeds = [b"config", collection_mint.key().as_ref()],
        bump
    )]
    pub config: Account<'info, CollectionConfig>,
    pub collection_mint: Account<'info, anchor_spl::token::Mint>,
    /// CHECK: Merkle tree
    pub merkle_tree: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintBadge<'info> {
    #[account(mut, seeds = [b"config", config.collection_mint.as_ref()], bump = config.bump)]
    pub config: Account<'info, CollectionConfig>,
    /// CHECK: Tree config
    #[account(mut)]
    pub tree_config: UncheckedAccount<'info>,
    /// CHECK: Merkle tree
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Recipient
    pub recipient: UncheckedAccount<'info>,
    pub collection_mint: Account<'info, anchor_spl::token::Mint>,
    /// CHECK: Metadata
    #[account(mut)]
    pub collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Edition
    pub edition_account: UncheckedAccount<'info>,
    /// CHECK: Bubblegum signer
    pub bubblegum_signer: UncheckedAccount<'info>,
    /// CHECK: Log wrapper
    pub log_wrapper: UncheckedAccount<'info>,
    /// CHECK: Compression program
    pub compression_program: UncheckedAccount<'info>,
    pub token_metadata_program: Program<'info, anchor_spl::metadata::Metadata>,
    /// CHECK: Bubblegum
    pub bubblegum_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}